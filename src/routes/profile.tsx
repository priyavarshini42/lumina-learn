import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, Save, User as UserIcon, Globe, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { supabase } from "@/integrations/supabase/client";
import { educationLabel, useAuth } from "@/hooks/useAuth";
import { LANGUAGES, useLanguage } from "@/lib/i18n";
import { isPasswordValid, usernameToAuthEmail } from "@/lib/validation";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Vidya AI" },
      {
        name: "description",
        content: "Manage your Vidya AI student profile, preferred language and password.",
      },
      { property: "og:title", content: "My Vidya AI Profile" },
      { property: "og:description", content: "Manage your student profile and learning language." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#FF4FD9]/60";

function ProfilePage() {
  const { profile, user, loading, refresh, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/profile" }, replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      if (profile.preferred_language) setLanguage(profile.preferred_language);
    }
  }, [profile, setLanguage]);

  if (loading || !profile) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-white/60">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("common.loading")}
        </div>
      </AppShell>
    );
  }

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        preferred_language: language,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile");
      return;
    }
    await refresh();
    toast.success(t("profile.saved"));
  };

  const changePassword = async () => {
    if (!isPasswordValid(newPw)) {
      toast.error("New password needs 8+ chars with upper, lower, number and symbol");
      return;
    }
    setChanging(true);
    // Re-verify the old password before allowing the change.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(profile.username),
      password: oldPw,
    });
    if (verifyError) {
      setChanging(false);
      toast.error("Your old password is incorrect");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChanging(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOldPw("");
    setNewPw("");
    toast.success("Password updated");
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Account"
        title={`*${t("profile.title")}*`}
        description="Your identity, language and security settings live here."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false}>
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#FF4FD9] via-[#A855F7] to-[#6366F1] p-[3px] animate-pulse-glow">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#120F33] text-2xl font-bold text-white">
                  {(profile.full_name || profile.username).slice(0, 1).toUpperCase()}
                </div>
              </div>
              <div className="mt-4 text-lg font-bold text-white">{profile.full_name}</div>
              <div className="text-sm text-[#FF4FD9]">@{profile.username}</div>
              <div className="mt-1 text-xs text-white/60">{educationLabel(profile)}</div>
              <div className="mt-4 w-full space-y-2 text-left text-xs text-white/60">
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Language</span>
                  <span className="text-white">
                    {LANGUAGES.find((l) => l.code === language)?.native ?? "English"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Member since</span>
                  <span className="text-white">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/", replace: true });
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" /> {t("cta.signOut")}
              </button>
            </div>
          </GlassCard>
        </motion.div>

        <div className="space-y-6">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <UserIcon className="h-3.5 w-3.5" /> Personal details
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  {t("auth.fullName")}
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  {t("profile.phone")}
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/50">
                  <Globe className="h-3 w-3" /> {t("auth.language")}
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`${inputClass} mt-1.5 appearance-none`}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#120F33]">
                      {l.native} — {l.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-neon btn-neon-hover mt-5 inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("profile.save")}
            </button>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <Lock className="h-3.5 w-3.5" /> {t("profile.changePassword")}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  {t("profile.oldPassword")}
                </span>
                <input
                  type="password"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  autoComplete="current-password"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  {t("profile.newPassword")}
                </span>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
            </div>
            <button
              onClick={changePassword}
              disabled={changing || !oldPw || !newPw}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              {changing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {t("profile.changePassword")}
            </button>
          </GlassCard>

          <div className="text-center text-xs text-white/40">
            Need to link a parent account?{" "}
            <Link to="/parents" className="text-[#FF4FD9]">
              Open the Parent Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
