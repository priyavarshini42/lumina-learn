CREATE TABLE public.exam_schedules (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  day_of_week SMALLINT NOT NULL DEFAULT 6 CHECK (day_of_week BETWEEN 0 AND 6),
  hour_ist SMALLINT NOT NULL DEFAULT 8 CHECK (hour_ist BETWEEN 0 AND 23),
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_schedules TO authenticated;
GRANT ALL ON public.exam_schedules TO service_role;

ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own exam schedule"
ON public.exam_schedules FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents can view their child's exam schedule"
ON public.exam_schedules FOR SELECT TO authenticated
USING (public.is_linked_parent(auth.uid(), user_id));

CREATE TRIGGER trg_exam_schedules_updated
BEFORE UPDATE ON public.exam_schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();