import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LANGUAGES, useLanguage } from "@/lib/i18n";
import {
  checkUsername,
  isPasswordValid,
  passwordChecks,
  passwordStrength,
  signUpSchema,
  usernameToAuthEmail,
  USERNAME_HINTS,
} from "@/lib/validation";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In — Vidya AI" },
      {
        name: "description",
        content:
          "Sign in or create your free Vidya AI student account to learn with a multilingual AI teacher.",
      },
      { property: "og:title", content: "Sign in to Vidya AI" },
      {
        property: "og:description",
        content: "Create a student account and start learning with your personal AI teacher.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const STREAMS = ["MPC", "BiPC", "MEC", "CEC", "HEC"] as const;

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-white/50">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="mt-1 text-xs">{hint}</div>}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#FF4FD9]/60 focus:bg-white/10";

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");

  const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/dashboard";

  useEffect(() => {
    if (!loading && session) navigate({ to: target, replace: true });
  }, [loading, session, navigate, target]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* floating gradients — same language as the landing page */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[#FF4FD9]/25 blur-3xl animate-drift" />
        <div className="absolute top-1/4 -right-40 h-[600px] w-[600px] rounded-full bg-[#6366F1]/25 blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full bg-[#A855F7]/20 blur-3xl animate-drift" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-4 py-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Brand side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center lg:text-left"
        >
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center animate-pulse-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight text-left">
              <div className="font-display text-xl font-bold text-white">Vidya AI</div>
              <div className="text-[10px] uppercase tracking-widest text-[#FF4FD9]">
                Personal AI Teacher
              </div>
            </div>
          </Link>
          <h1 className="mt-8 font-display text-3xl font-bold text-white sm:text-4xl">
            Your <span className="text-gradient">AI teacher</span> is waiting.
          </h1>
          <p className="mt-3 text-white/70">
            One account unlocks your AI classroom, doubt solver, lens scanner, weekend exams and
            skill roadmap — in your own language.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50 lg:justify-start">
            <ShieldCheck className="h-4 w-4 text-[#FF4FD9]" />
            Private by default. Your learning data is only yours.
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex rounded-full bg-white/5 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === m
                    ? "bg-gradient-to-r from-[#FF4FD9] to-[#6366F1] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {m === "signin" ? t("cta.signIn") : t("auth.createAccount")}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "signin" ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <SignInForm onDone={() => navigate({ to: target })} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <SignUpForm
                  language={language}
                  onLanguage={setLanguage}
                  onDone={() => navigate({ to: target })}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center text-xs text-white/50">
            {mode === "signin" ? (
              <>
                {t("auth.noAccount")}{" "}
                <button className="text-[#FF4FD9]" onClick={() => setMode("signup")}>
                  {t("auth.createAccount")}
                </button>
              </>
            ) : (
              <>
                {t("auth.haveAccount")}{" "}
                <button className="text-[#FF4FD9]" onClick={() => setMode("signin")}>
                  {t("cta.signIn")}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = username.trim().toLowerCase();
    if (!uname || !password) {
      toast.error("Enter your username and password");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(uname),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Incorrect username or password");
      return;
    }
    if (!remember) window.sessionStorage.setItem("vidya.session-only", "1");
    toast.success("Welcome back to Vidya AI");
    onDone();
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field label={t("auth.username")}>
        <input
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
          placeholder="priya.varshini"
          className={inputClass}
        />
      </Field>

      <Field label={t("auth.password")}>
        <div className="relative">
          <input
            value={password}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-white/60">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[#FF4FD9]"
          />
          {t("auth.remember")}
        </label>
        <ForgotPassword />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn-neon btn-neon-hover w-full justify-center inline-flex items-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {t("cta.signIn")}
      </button>
    </form>
  );
}

function ForgotPassword() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="text-[#FF4FD9]" onClick={() => setOpen((v) => !v)}>
        Forgot password?
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass absolute left-1/2 z-20 mt-2 w-72 -translate-x-1/2 rounded-2xl p-4 text-left text-xs text-white/70"
          >
            Vidya accounts use a username instead of an email, so a teacher or parent must reset it
            from the student's profile page. Ask your school mentor for help — we never store an
            email you didn't give us.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SignUpForm({
  language,
  onLanguage,
  onDone,
}: {
  language: string;
  onLanguage: (code: string) => void;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [educationType, setEducationType] = useState<"school" | "intermediate">("school");
  const [grade, setGrade] = useState<number | null>(null);
  const [interYear, setInterYear] = useState<"first" | "second" | null>(null);
  const [stream, setStream] = useState<(typeof STREAMS)[number] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unameCheck = checkUsername(username);
  const strength = passwordStrength(password);
  const checks = passwordChecks(password);

  // Debounced real-time availability check.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!unameCheck.valid) {
      setAvailability("idle");
      return;
    }
    setAvailability("checking");
    timer.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_username_available", {
        _username: username.trim().toLowerCase(),
      });
      if (error) {
        setAvailability("idle");
        return;
      }
      setAvailability(data ? "free" : "taken");
    }, 450);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [username, unameCheck.valid]);

  const canSubmit = useMemo(
    () =>
      fullName.trim().length >= 2 &&
      unameCheck.valid &&
      availability === "free" &&
      isPasswordValid(password) &&
      password === confirm &&
      (educationType === "school" ? grade !== null : interYear !== null && stream !== null),
    [fullName, unameCheck.valid, availability, password, confirm, educationType, grade, interYear, stream],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      fullName: fullName.trim(),
      educationType,
      gradeNumber: educationType === "school" ? grade : null,
      interYear: educationType === "intermediate" ? interYear : null,
      stream: educationType === "intermediate" ? stream : null,
      username: username.trim().toLowerCase(),
      password,
      language,
    });
    if (!parsed.success) {
      toast.error("Please complete every field correctly");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: usernameToAuthEmail(parsed.data.username),
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          username: parsed.data.username,
          education_type: parsed.data.educationType,
          grade_number: parsed.data.gradeNumber ?? null,
          inter_year: parsed.data.interYear ?? null,
          stream: parsed.data.stream ?? null,
          preferred_language: parsed.data.language,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "That username is already taken"
          : error.message,
      );
      return;
    }
    toast.success("Account created — welcome to Vidya AI!");
    onDone();
  };

  const strengthColor =
    strength.level === "strong"
      ? "bg-emerald-400"
      : strength.level === "medium"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field label={t("auth.fullName")}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Priya Varshini"
          autoComplete="name"
          className={inputClass}
        />
      </Field>

      <Field label={t("auth.education")}>
        <div className="grid grid-cols-2 gap-2">
          {(["school", "intermediate"] as const).map((edu) => (
            <button
              key={edu}
              type="button"
              onClick={() => {
                setEducationType(edu);
                setGrade(null);
                setInterYear(null);
                setStream(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition ${
                educationType === edu
                  ? "bg-gradient-to-r from-[#FF4FD9] to-[#6366F1] text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              {edu === "school" ? t("auth.school") : t("auth.intermediate")}
            </button>
          ))}
        </div>
      </Field>

      <AnimatePresence mode="wait">
        {educationType === "school" ? (
          <motion.div
            key="school"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Field label={t("auth.grade")}>
              <div className="grid grid-cols-5 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`rounded-xl py-2 text-sm transition ${
                      grade === g ? "bg-white/20 text-white neon-ring" : "bg-white/5 text-white/70"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>
          </motion.div>
        ) : (
          <motion.div
            key="inter"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <Field label={t("auth.year")}>
              <div className="grid grid-cols-2 gap-2">
                {(["first", "second"] as const).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setInterYear(y)}
                    className={`rounded-xl py-2.5 text-sm transition ${
                      interYear === y ? "bg-white/20 text-white neon-ring" : "bg-white/5 text-white/70"
                    }`}
                  >
                    {y === "first" ? "First Year" : "Second Year"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t("auth.stream")}>
              <div className="grid grid-cols-5 gap-2">
                {STREAMS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStream(s)}
                    className={`rounded-xl py-2 text-xs transition ${
                      stream === s ? "bg-white/20 text-white neon-ring" : "bg-white/5 text-white/70"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </motion.div>
        )}
      </AnimatePresence>

      <Field
        label={t("auth.username")}
        hint={
          username &&
          (!unameCheck.valid ? (
            <span className="flex items-center gap-1 text-red-300">
              <X className="h-3 w-3" />
              {unameCheck.issue ? USERNAME_HINTS[unameCheck.issue] : "Invalid username"}
            </span>
          ) : availability === "checking" ? (
            <span className="flex items-center gap-1 text-white/50">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("auth.checking")}
            </span>
          ) : availability === "free" ? (
            <span className="flex items-center gap-1 text-emerald-300">
              <Check className="h-3 w-3" /> {t("auth.available")}
            </span>
          ) : availability === "taken" ? (
            <span className="flex items-center gap-1 text-red-300">
              <X className="h-3 w-3" /> {t("auth.taken")}
            </span>
          ) : null)
        }
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
          placeholder="priya_123"
          autoComplete="off"
          className={`${inputClass} ${
            username && !unameCheck.valid
              ? "border-red-400/50"
              : availability === "free"
                ? "border-emerald-400/50"
                : availability === "taken"
                  ? "border-red-400/50"
                  : ""
          }`}
        />
      </Field>

      <Field label={t("auth.password")}>
        <div className="relative">
          <input
            value={password}
            type={show ? "text" : "password"}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password && (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                animate={{ width: `${(strength.score / 6) * 100}%` }}
                transition={{ duration: 0.3 }}
                className={`h-full rounded-full ${strengthColor}`}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              <span className="capitalize text-white/60">{strength.level}</span>
              {(
                [
                  ["length", "8+ chars"],
                  ["upper", "A-Z"],
                  ["lower", "a-z"],
                  ["number", "0-9"],
                  ["special", "!@#"],
                ] as const
              ).map(([key, label]) => (
                <span
                  key={key}
                  className={checks[key] ? "text-emerald-300" : "text-white/35"}
                >
                  {checks[key] ? "✓" : "•"} {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </Field>

      <Field
        label={t("auth.confirmPassword")}
        hint={
          confirm ? (
            password === confirm ? (
              <span className="flex items-center gap-1 text-emerald-300">
                <Check className="h-3 w-3" /> {t("auth.match")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-300">
                <X className="h-3 w-3" /> {t("auth.noMatch")}
              </span>
            )
          ) : null
        }
      >
        <input
          value={confirm}
          type={show ? "text" : "password"}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      <Field label={t("auth.language")}>
        <select
          value={language}
          onChange={(e) => onLanguage(e.target.value)}
          className={`${inputClass} appearance-none`}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-[#120F33]">
              {l.native} — {l.name}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="btn-neon btn-neon-hover w-full justify-center inline-flex items-center gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t("auth.createAccount")}
      </button>
    </form>
  );
}
