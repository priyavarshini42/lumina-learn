-- Learning preferences
CREATE TABLE public.learning_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  medium text NOT NULL DEFAULT 'English',
  learning_speed text NOT NULL DEFAULT 'normal',
  daily_minutes smallint NOT NULL DEFAULT 45,
  voice_language text NOT NULL DEFAULT 'en',
  board text NOT NULL DEFAULT 'AP State Board',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_preferences TO authenticated;
GRANT ALL ON public.learning_preferences TO service_role;
ALTER TABLE public.learning_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY lp_read ON public.learning_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_linked_parent(auth.uid(), user_id));
CREATE POLICY lp_insert ON public.learning_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY lp_update ON public.learning_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_lp_updated BEFORE UPDATE ON public.learning_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chapter progress
CREATE TABLE public.chapter_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_progress TO authenticated;
GRANT ALL ON public.chapter_progress TO service_role;
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_read ON public.chapter_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_linked_parent(auth.uid(), user_id));
CREATE POLICY cp_insert ON public.chapter_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY cp_update ON public.chapter_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_cp_updated BEFORE UPDATE ON public.chapter_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Lesson sessions
CREATE TABLE public.lesson_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_title text NOT NULL,
  lesson jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step smallint NOT NULL DEFAULT 0,
  language text NOT NULL DEFAULT 'en',
  completed boolean NOT NULL DEFAULT false,
  quiz_score smallint,
  session_date date NOT NULL DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lesson_sessions_user_date ON public.lesson_sessions (user_id, session_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_sessions TO authenticated;
GRANT ALL ON public.lesson_sessions TO service_role;
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ls_read ON public.lesson_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_linked_parent(auth.uid(), user_id));
CREATE POLICY ls_insert ON public.lesson_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY ls_update ON public.lesson_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ls_delete ON public.lesson_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER trg_ls_updated BEFORE UPDATE ON public.lesson_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Homework
CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.lesson_sessions(id) ON DELETE CASCADE,
  chapter_title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb,
  score numeric(5,2),
  report jsonb,
  status text NOT NULL DEFAULT 'assigned',
  due_date date NOT NULL DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY hw_read ON public.homework FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_linked_parent(auth.uid(), user_id));
CREATE POLICY hw_insert ON public.homework FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY hw_update ON public.homework FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_hw_updated BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Attendance
CREATE TABLE public.study_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_date date NOT NULL DEFAULT (now()::date),
  minutes smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, study_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_attendance TO authenticated;
GRANT ALL ON public.study_attendance TO service_role;
ALTER TABLE public.study_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY sa_read ON public.study_attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_linked_parent(auth.uid(), user_id));
CREATE POLICY sa_insert ON public.study_attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY sa_update ON public.study_attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_sa_updated BEFORE UPDATE ON public.study_attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();