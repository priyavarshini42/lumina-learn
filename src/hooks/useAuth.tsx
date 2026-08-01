import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type StudentSettings = Tables<"student_settings">;

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  settings: StudentSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<StudentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setSettings(null);
      return;
    }
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("student_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setProfile(p ?? null);
    setSettings(s ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      void loadProfile(nextSession?.user?.id);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user?.id);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSettings(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      settings,
      loading,
      refresh,
      signOut,
    }),
    [session, profile, settings, loading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Human-readable education label, e.g. "Grade 7" or "Intermediate 1st Year · MPC". */
export function educationLabel(profile: Profile | null): string {
  if (!profile) return "";
  if (profile.education_type === "school") return `Grade ${profile.grade_number}`;
  const year = profile.inter_year === "first" ? "1st Year" : "2nd Year";
  return `Intermediate ${year} · ${profile.stream}`;
}
