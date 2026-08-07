CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  homework_enabled boolean NOT NULL DEFAULT true,
  quiz_enabled boolean NOT NULL DEFAULT true,
  streak_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY np_read_own ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY np_insert_own ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY np_update_own ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_np_updated BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_edu public.education_type := COALESCE(NULLIF(m->>'education_type','')::public.education_type, 'school');
BEGIN
  INSERT INTO public.profiles (
    id, full_name, username, education_type, grade_number, inter_year, stream, preferred_language
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(m->>'full_name',''), 'Student'),
    COALESCE(NULLIF(lower(m->>'username'),''), 'user' || substr(replace(NEW.id::text,'-',''),1,8)),
    v_edu,
    CASE WHEN v_edu = 'school' THEN COALESCE(NULLIF(m->>'grade_number','')::smallint, 5) END,
    CASE WHEN v_edu = 'intermediate' THEN COALESCE(NULLIF(m->>'inter_year','')::public.inter_year,'first') END,
    CASE WHEN v_edu = 'intermediate' THEN COALESCE(NULLIF(m->>'stream','')::public.stream_code,'MPC') END,
    COALESCE(NULLIF(m->>'preferred_language',''), 'en')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.student_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.notify_parents(_student uuid, _kind text, _title text, _body text, _href text, _meta jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (recipient_id, student_id, kind, title, body, href, meta)
  SELECT l.parent_id, _student, _kind, _title, _body, _href, COALESCE(_meta, '{}'::jsonb)
  FROM public.parent_student_links l
  LEFT JOIN public.notification_preferences p ON p.user_id = l.parent_id
  WHERE l.student_id = _student AND l.approved
    AND CASE _kind
      WHEN 'homework' THEN COALESCE(p.homework_enabled, true)
      WHEN 'quiz' THEN COALESCE(p.quiz_enabled, true)
      WHEN 'streak' THEN COALESCE(p.streak_enabled, true)
      ELSE true
    END;
END; $function$;

REVOKE ALL ON FUNCTION public.notify_parents(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;