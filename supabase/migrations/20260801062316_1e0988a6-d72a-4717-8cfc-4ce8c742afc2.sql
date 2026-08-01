-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('student','parent','admin');
CREATE TYPE public.education_type AS ENUM ('school','intermediate');
CREATE TYPE public.inter_year AS ENUM ('first','second');
CREATE TYPE public.stream_code AS ENUM ('MPC','BiPC','MEC','CEC','HEC');

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ LANGUAGES ============
CREATE TABLE public.languages (
  code TEXT PRIMARY KEY CHECK (code ~ '^[a-z]{2,3}$'),
  name TEXT NOT NULL UNIQUE,
  native_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100
);
GRANT SELECT ON public.languages TO authenticated, anon;
GRANT ALL ON public.languages TO service_role;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "languages_read_all" ON public.languages FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.languages (code,name,native_name,sort_order) VALUES
 ('en','English','English',1),
 ('hi','Hindi','हिन्दी',2),
 ('te','Telugu','తెలుగు',3),
 ('ta','Tamil','தமிழ்',4),
 ('kn','Kannada','ಕನ್ನಡ',5),
 ('ml','Malayalam','മലയാളം',6),
 ('mr','Marathi','मराठी',7),
 ('gu','Gujarati','ગુજરાતી',8),
 ('pa','Punjabi','ਪੰਜਾਬੀ',9),
 ('bn','Bengali','বাংলা',10),
 ('or','Odia','ଓଡ଼ିଆ',11),
 ('ur','Urdu','اردو',12),
 ('as','Assamese','অসমীয়া',13),
 ('kok','Konkani','कोंकणी',14),
 ('mni','Manipuri','মৈতৈলোন্',15),
 ('sa','Sanskrit','संस्कृतम्',16),
 ('brx','Bodo','बड़ो',17),
 ('doi','Dogri','डोगरी',18),
 ('ks','Kashmiri','کٲشُر',19),
 ('mai','Maithili','मैथिली',20),
 ('ne','Nepali','नेपाली',21),
 ('sat','Santali','ᱥᱟᱱᱛᱟᱲᱤ',22),
 ('sd','Sindhi','سنڌي',23);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 100),
  username TEXT NOT NULL UNIQUE CHECK (username ~ '^[a-z][a-z0-9._]{3,29}$'),
  education_type public.education_type NOT NULL DEFAULT 'school',
  grade_number SMALLINT CHECK (grade_number BETWEEN 1 AND 10),
  inter_year public.inter_year,
  stream public.stream_code,
  phone TEXT CHECK (phone IS NULL OR phone ~ '^[0-9+\-\s]{6,20}$'),
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' REFERENCES public.languages(code) ON UPDATE CASCADE,
  bio TEXT CHECK (bio IS NULL OR char_length(bio) <= 500),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_education_shape CHECK (
    (education_type = 'school' AND grade_number IS NOT NULL AND inter_year IS NULL AND stream IS NULL)
    OR (education_type = 'intermediate' AND grade_number IS NULL AND inter_year IS NOT NULL AND stream IS NOT NULL)
  )
);
CREATE INDEX idx_profiles_username ON public.profiles (username);
CREATE INDEX idx_profiles_education ON public.profiles (education_type, grade_number, stream);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles (user_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ PARENT LINKS ============
CREATE TABLE public.parent_student_links (
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relation TEXT NOT NULL DEFAULT 'guardian' CHECK (relation IN ('mother','father','guardian','other')),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, student_id),
  CONSTRAINT parent_not_student CHECK (parent_id <> student_id)
);
CREATE INDEX idx_psl_student ON public.parent_student_links (student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_student_links TO authenticated;
GRANT ALL ON public.parent_student_links TO service_role;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psl_read_involved" ON public.parent_student_links FOR SELECT TO authenticated
  USING (parent_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "psl_parent_insert" ON public.parent_student_links FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY "psl_student_approve" ON public.parent_student_links FOR UPDATE TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "psl_delete_involved" ON public.parent_student_links FOR DELETE TO authenticated
  USING (parent_id = auth.uid() OR student_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_linked_parent(_parent UUID, _student UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.parent_student_links
    WHERE parent_id = _parent AND student_id = _student AND approved);
$$;

CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_linked_parent(auth.uid(), id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============ USERNAME AVAILABILITY ============
CREATE OR REPLACE FUNCTION public.is_username_available(_username TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _username ~ '^[a-z][a-z0-9._]{3,29}$'
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = lower(_username));
$$;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;

-- ============ STUDENT SETTINGS ============
CREATE TABLE public.student_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','system')),
  daily_goal_minutes SMALLINT NOT NULL DEFAULT 45 CHECK (daily_goal_minutes BETWEEN 5 AND 600),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_time TIME NOT NULL DEFAULT '18:00',
  voice_enabled BOOLEAN NOT NULL DEFAULT true,
  profile_visibility TEXT NOT NULL DEFAULT 'private' CHECK (profile_visibility IN ('private','parents','public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_settings TO authenticated;
GRANT ALL ON public.student_settings TO service_role;
ALTER TABLE public.student_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read" ON public.student_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_linked_parent(auth.uid(), user_id));
CREATE POLICY "settings_insert_own" ON public.student_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "settings_update_own" ON public.student_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.student_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SIGNUP TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ACADEMIC CATALOG ============
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]{2,40}$'),
  name TEXT NOT NULL,
  icon TEXT,
  education_type public.education_type NOT NULL,
  grade_number SMALLINT CHECK (grade_number BETWEEN 1 AND 10),
  stream public.stream_code,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subjects_scope ON public.subjects (education_type, grade_number, stream);
GRANT SELECT ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_read" ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_id, title)
);
CREATE INDEX idx_chapters_subject ON public.chapters (subject_id, sort_order);
GRANT SELECT ON public.chapters TO authenticated;
GRANT ALL ON public.chapters TO service_role;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapters_read" ON public.chapters FOR SELECT TO authenticated USING (true);

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  difficulty SMALLINT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
  estimated_minutes SMALLINT NOT NULL DEFAULT 20 CHECK (estimated_minutes BETWEEN 5 AND 240),
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chapter_id, title)
);
CREATE INDEX idx_topics_chapter ON public.topics (chapter_id, sort_order);
GRANT SELECT ON public.topics TO authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_read" ON public.topics FOR SELECT TO authenticated USING (true);

INSERT INTO public.subjects (code,name,icon,education_type,grade_number,sort_order)
SELECT format('g%s_%s', g, s.code), s.name, s.icon, 'school', g, s.ord
FROM generate_series(1,10) g
CROSS JOIN (VALUES
  ('maths','Mathematics','calculator',1),
  ('science','Science','flask',2),
  ('english','English','book',3),
  ('social','Social Studies','globe',4),
  ('computer','Computer Basics','cpu',5)
) AS s(code,name,icon,ord);

INSERT INTO public.subjects (code,name,icon,education_type,stream,sort_order) VALUES
 ('mpc_maths','Mathematics','calculator','intermediate','MPC',1),
 ('mpc_physics','Physics','atom','intermediate','MPC',2),
 ('mpc_chemistry','Chemistry','flask','intermediate','MPC',3),
 ('bipc_botany','Botany','leaf','intermediate','BiPC',1),
 ('bipc_zoology','Zoology','bug','intermediate','BiPC',2),
 ('bipc_physics','Physics','atom','intermediate','BiPC',3),
 ('bipc_chemistry','Chemistry','flask','intermediate','BiPC',4),
 ('mec_maths','Mathematics','calculator','intermediate','MEC',1),
 ('mec_economics','Economics','trending-up','intermediate','MEC',2),
 ('mec_commerce','Commerce','briefcase','intermediate','MEC',3),
 ('cec_civics','Civics','landmark','intermediate','CEC',1),
 ('cec_economics','Economics','trending-up','intermediate','CEC',2),
 ('cec_commerce','Commerce','briefcase','intermediate','CEC',3),
 ('hec_history','History','scroll','intermediate','HEC',1),
 ('hec_economics','Economics','trending-up','intermediate','HEC',2),
 ('hec_civics','Civics','landmark','intermediate','HEC',3);
