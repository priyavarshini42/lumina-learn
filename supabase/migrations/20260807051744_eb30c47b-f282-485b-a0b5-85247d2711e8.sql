CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_recipient_idx ON public.notifications (recipient_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_read_own ON public.notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY notif_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

CREATE TRIGGER trg_notifications_updated BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Fan out one notification to every approved parent of a student.
CREATE OR REPLACE FUNCTION public.notify_parents(
  _student uuid, _kind text, _title text, _body text, _href text, _meta jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, student_id, kind, title, body, href, meta)
  SELECT l.parent_id, _student, _kind, _title, _body, _href, COALESCE(_meta, '{}'::jsonb)
  FROM public.parent_student_links l
  WHERE l.student_id = _student AND l.approved;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_homework_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
BEGIN
  SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.user_id;
  student_name := COALESCE(student_name, 'Your child');

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_parents(
      NEW.user_id, 'homework',
      'New homework assigned',
      student_name || ' has homework for "' || NEW.chapter_title || '" due on ' || to_char(NEW.due_date, 'DD Mon YYYY') || '.',
      '/parents', jsonb_build_object('homework_id', NEW.id, 'due_date', NEW.due_date)
    );
  ELSIF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
    PERFORM public.notify_parents(
      NEW.user_id, 'homework',
      'Homework due date changed',
      '"' || NEW.chapter_title || '" is now due on ' || to_char(NEW.due_date, 'DD Mon YYYY') || '.',
      '/parents', jsonb_build_object('homework_id', NEW.id, 'due_date', NEW.due_date)
    );
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'evaluated' AND OLD.status IS DISTINCT FROM 'evaluated' THEN
    PERFORM public.notify_parents(
      NEW.user_id, 'homework',
      'Homework evaluated',
      student_name || ' scored ' || COALESCE(round(NEW.score)::text || '%', 'a result') || ' on "' || NEW.chapter_title || '".',
      '/parents', jsonb_build_object('homework_id', NEW.id, 'score', NEW.score)
    );
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_homework_insert AFTER INSERT ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.notify_homework_change();
CREATE TRIGGER trg_notify_homework_update AFTER UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.notify_homework_change();

CREATE OR REPLACE FUNCTION public.notify_quiz_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
BEGIN
  IF NEW.quiz_score IS NOT NULL AND NEW.quiz_score IS DISTINCT FROM OLD.quiz_score THEN
    SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.user_id;
    PERFORM public.notify_parents(
      NEW.user_id, 'quiz',
      'New quiz score',
      COALESCE(student_name, 'Your child') || ' scored ' || NEW.quiz_score || '/5 in the "' || NEW.chapter_title || '" quiz.',
      '/parents', jsonb_build_object('session_id', NEW.id, 'score', NEW.quiz_score)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_quiz_score AFTER UPDATE ON public.lesson_sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_quiz_score();

CREATE OR REPLACE FUNCTION public.notify_streak_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak int := 0;
  cursor_date date := NEW.study_date;
  student_name text;
  already boolean;
BEGIN
  IF NEW.minutes <= 0 THEN RETURN NEW; END IF;

  WHILE EXISTS (
    SELECT 1 FROM public.study_attendance
    WHERE user_id = NEW.user_id AND study_date = cursor_date AND minutes > 0
  ) LOOP
    streak := streak + 1;
    cursor_date := cursor_date - 1;
  END LOOP;

  IF streak NOT IN (3, 7, 14, 30, 50, 100) THEN RETURN NEW; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE student_id = NEW.user_id AND kind = 'streak' AND (meta->>'streak')::int = streak
  ) INTO already;
  IF already THEN RETURN NEW; END IF;

  SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.notify_parents(
    NEW.user_id, 'streak',
    streak || '-day learning streak!',
    COALESCE(student_name, 'Your child') || ' has studied ' || streak || ' days in a row. Celebrate the effort!',
    '/parents', jsonb_build_object('streak', streak)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_streak_insert AFTER INSERT ON public.study_attendance
  FOR EACH ROW EXECUTE FUNCTION public.notify_streak_milestone();
CREATE TRIGGER trg_notify_streak_update AFTER UPDATE ON public.study_attendance
  FOR EACH ROW EXECUTE FUNCTION public.notify_streak_milestone();