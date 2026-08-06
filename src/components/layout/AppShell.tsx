import { Link, useRouterState } from "@tanstack/react-router";
import {
  Brain,
  Camera,
  GraduationCap,
  Heart,
  Home,
  MessageSquare,
  Trophy,
  BookOpen,
  Users,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/classroom", label: "AI Classroom", icon: GraduationCap },
  { to: "/lens", label: "AI Lens", icon: Camera },
  { to: "/tutor", label: "Doubt Solver", icon: MessageSquare },
  { to: "/dashboard", label: "Dashboard", icon: Brain },
  { to: "/exams", label: "Exams", icon: BookOpen },
  { to: "/skills", label: "Skills", icon: Sparkles },
  { to: "/wellness", label: "Wellness", icon: Heart },
  { to: "/stories", label: "Stories", icon: Trophy },
  { to: "/parents", label: "Parents", icon: Users },
];

function Particles() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#FF4FD9]/20 blur-3xl animate-drift" />
      <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[#6366F1]/25 blur-3xl animate-float-slow" />
      <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#A855F7]/20 blur-3xl animate-drift" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen">
      <Particles />
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl bg-[#120F33]/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center animate-pulse-glow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-white">Vidya AI</div>
              <div className="text-[10px] uppercase tracking-widest text-[#FF4FD9]">
                Personal AI Teacher
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.slice(0, 7).map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-full text-sm transition ${
                    active
                      ? "bg-white/10 text-white neon-ring"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/tutor"
              className="hidden sm:inline-flex btn-neon btn-neon-hover text-sm"
            >
              Start Learning
            </Link>
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-white/5 bg-[#120F33]/90"
            >
              <div className="grid grid-cols-2 gap-2 p-4">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80"
                  >
                    <item.icon className="h-4 w-4 text-[#FF4FD9]" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <div className="glass-strong flex items-center gap-1 rounded-full px-2 py-2 shadow-2xl">
          {[NAV[0], NAV[1], NAV[3], NAV[4], NAV[7]].map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center rounded-full px-3 py-1.5 text-[10px] transition ${
                  active ? "bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] text-white" : "text-white/70"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Always-available AI doubt solver */}
      <DoubtSolver />

      <footer className="border-t border-white/5 mt-16">
        <div className="mx-auto max-w-7xl px-6 py-10 grid gap-8 md:grid-cols-3 text-sm text-white/60">
          <div>
            <div className="font-display text-white text-lg font-bold">Vidya AI</div>
            <p className="mt-2">
              An AI-powered personal teacher and life mentor for every student — built for
              IDEA2IMPACT 2026, Sustainability &amp; Social Impact.
            </p>
          </div>
          <div>
            <div className="text-white font-semibold mb-2">Learn</div>
            <ul className="space-y-1">
              <li><Link to="/classroom">AI Classroom</Link></li>
              <li><Link to="/tutor">Doubt Solver</Link></li>
              <li><Link to="/lens">AI Lens Scanner</Link></li>
              <li><Link to="/exams">Weekend Exams</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-2">Grow</div>
            <ul className="space-y-1">
              <li><Link to="/skills">Skill Mentor</Link></li>
              <li><Link to="/wellness">Health &amp; Wellness</Link></li>
              <li><Link to="/stories">Moral Stories</Link></li>
              <li><Link to="/parents">Parent Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-white/40 pb-6">
          © 2026 Vidya AI · Every student deserves a personal AI teacher.
        </div>
      </footer>
    </div>
  );
}
