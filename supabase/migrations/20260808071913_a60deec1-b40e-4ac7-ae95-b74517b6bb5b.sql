CREATE TABLE public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL DEFAULT (date_trunc('week', now())::date),
  title text NOT NULL DEFAULT 'Weekend AI Exam',
  grade text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'en',
  chapters jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb,
  score numeric,
  report jsonb,
  status text NOT NULL DEFAULT 'generated',
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY exams_read ON public.exams FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_linked_parent(auth.uid(), user_id));
CREATE POLICY exams_insert ON public.exams FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY exams_update ON public.exams FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY exams_delete ON public.exams FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_exams_updated BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_exams_user_week ON public.exams (user_id, week_start DESC);