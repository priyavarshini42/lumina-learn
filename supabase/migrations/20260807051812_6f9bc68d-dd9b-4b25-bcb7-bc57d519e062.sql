REVOKE ALL ON FUNCTION public.notify_parents(uuid, text, text, text, text, jsonb) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_homework_change() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_quiz_score() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_streak_milestone() FROM public, anon, authenticated;