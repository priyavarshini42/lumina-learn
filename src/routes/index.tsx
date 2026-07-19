import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Sparkles,
  Languages,
  Brain,
  Camera,
  Heart,
  Trophy,
  BookOpen,
  Users,
  Mic,
  GraduationCap,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader, Stat } from "@/components/ui/Section";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vidya AI — Every Student Deserves a Personal AI Teacher" },
      {
        name: "description",
        content:
          "AI-powered multilingual mentor helping rural students learn, grow, and succeed beyond classrooms. Built for IDEA2IMPACT 2026.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: GraduationCap,
    title: "AI Avatar Classroom",
    desc: "Talking, multilingual AI teacher that explains, asks and encourages — in your language.",
    to: "/classroom",
    accent: "from-[#FF4FD9] to-[#A855F7]",
  },
  {
    icon: Camera,
    title: "AI Lens Scanner",
    desc: "Snap a textbook page or a hard problem — get step-by-step solutions instantly.",
    to: "/lens",
    accent: "from-[#A855F7] to-[#6366F1]",
  },
  {
    icon: Brain,
    title: "AI Doubt Solver",
    desc: "ChatGPT-style tutor for text, voice and image doubts, 24/7.",
    to: "/tutor",
    accent: "from-[#6366F1] to-[#22D3EE]",
  },
  {
    icon: BookOpen,
    title: "Weekend AI Exams",
    desc: "AI-generated weekly tests, mock exams and detailed performance analysis.",
    to: "/exams",
    accent: "from-[#F472B6] to-[#FF4FD9]",
  },
  {
    icon: Sparkles,
    title: "Skill Development Mentor",
    desc: "Personalised 3-month roadmaps for programming, English and more.",
    to: "/skills",
    accent: "from-[#FF4FD9] to-[#F59E0B]",
  },
  {
    icon: Heart,
    title: "Health &amp; Wellness",
    desc: "Meditation, outdoor challenges and food guidance for a healthy student life.",
    to: "/wellness",
    accent: "from-[#22D3EE] to-[#A855F7]",
  },
  {
    icon: Trophy,
    title: "Moral Stories",
    desc: "Weekend inspiration from APJ Abdul Kalam, scientists and entrepreneurs.",
    to: "/stories",
    accent: "from-[#F59E0B] to-[#FF4FD9]",
  },
  {
    icon: Users,
    title: "Parent Dashboard",
    desc: "Parents see progress, wellness activities and weak areas at a glance.",
    to: "/parents",
    accent: "from-[#A855F7] to-[#22D3EE]",
  },
];

function Index() {
  return (
    <AppShell>
      {/* HERO */}
      <section className="relative pt-8 pb-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#FF4FD9]/30 bg-[#FF4FD9]/10 px-3 py-1 text-xs uppercase tracking-widest text-[#FF4FD9]"
            >
              <Sparkles className="h-3 w-3" />
              IDEA2IMPACT 2026 · Sustainability &amp; Social Impact
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-white"
            >
              Every student deserves a{" "}
              <span className="text-gradient">personal AI teacher</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-5 text-lg text-white/70 max-w-xl"
            >
              An AI-powered multilingual mentor helping rural and underserved students learn,
              grow and succeed — far beyond the walls of the classroom.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/tutor" className="btn-neon btn-neon-hover inline-flex items-center gap-2">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/classroom"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                <Play className="h-4 w-4" /> Watch Demo
              </Link>
            </motion.div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat value="10+" label="Languages" />
              <Stat value="24/7" label="AI Support" />
              <Stat value="1:1" label="Personalized" />
              <Stat value="∞" label="Rural Reach" />
            </div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] max-w-md mx-auto">
              {/* Rings */}
              <div className="absolute inset-0 rounded-[2rem] border border-white/10 animate-float" />
              <div className="absolute inset-6 rounded-[2rem] border border-[#FF4FD9]/30 animate-float-slow" />

              {/* AI hologram card */}
              <div className="glass-strong absolute inset-8 rounded-[1.8rem] p-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center animate-pulse-glow">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Vidya · AI Teacher</div>
                    <div className="text-xs text-[#22D3EE] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                      Live · Teaching Photosynthesis
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="glass rounded-xl p-3 text-white/90">
                    “Namaste! Let's imagine a leaf as a tiny solar kitchen ☀️🍃”
                  </div>
                  <div className="glass rounded-xl p-3 text-white/90 ml-6">
                    <span className="text-[#FF4FD9]">You:</span> Why does the leaf look green?
                  </div>
                  <div className="glass rounded-xl p-3 text-white/90">
                    Great question! Chlorophyll absorbs red and blue light but reflects green…
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <div className="glass rounded-full flex items-center gap-2 px-4 py-2 text-xs text-white/70">
                    <Mic className="h-3.5 w-3.5 text-[#FF4FD9]" />
                    Speak in Telugu, Hindi, Tamil, Kannada or English
                  </div>
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -left-4 top-10 glass rounded-2xl px-3 py-2 text-xs text-white flex items-center gap-2"
              >
                <Languages className="h-4 w-4 text-[#FF4FD9]" /> Multilingual
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -right-2 top-32 glass rounded-2xl px-3 py-2 text-xs text-white flex items-center gap-2"
              >
                <Zap className="h-4 w-4 text-[#FF4FD9]" /> Instant Answers
              </motion.div>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute -left-6 bottom-14 glass rounded-2xl px-3 py-2 text-xs text-white flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-[#FF4FD9]" /> Safe for Kids
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16">
        <SectionHeader
          center
          eyebrow="A complete learning companion"
          title="One AI. *Every part of a student's life*."
          description="From classroom concepts to career skills, health and inspiration — Vidya AI supports the whole student."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={f.to} className="block h-full">
                <GlassCard className="h-full">
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4`}
                  >
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-white font-semibold" dangerouslySetInnerHTML={{ __html: f.title }} />
                  <p className="mt-2 text-sm text-white/60" dangerouslySetInnerHTML={{ __html: f.desc }} />
                  <div className="mt-4 inline-flex items-center gap-1 text-xs text-[#FF4FD9]">
                    Explore <ArrowRight className="h-3 w-3" />
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* IMPACT */}
      <section className="py-16">
        <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-[#FF4FD9]/30 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Our Mission</div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
                Bridging the education gap for{" "}
                <span className="text-gradient">rural India</span>.
              </h2>
              <p className="mt-4 text-white/70">
                Millions of students lack access to quality teachers, mentors and personalised
                support. Vidya AI puts a warm, patient, multilingual teacher in every pocket — free
                of geography and privilege.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Rural students empowered", "Every village"],
                ["Native language support", "10+ Indian languages"],
                ["24/7 personal mentor", "Any time, anywhere"],
                ["Beyond academics", "Skills · Health · Morals"],
              ].map(([v, l]) => (
                <div key={v} className="glass rounded-2xl p-4">
                  <div className="text-white font-semibold">{v}</div>
                  <div className="text-xs text-white/60 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Ready to meet your <span className="text-gradient">AI teacher</span>?
        </h2>
        <p className="mt-3 text-white/70 max-w-xl mx-auto">
          Ask any doubt in any language. Vidya is patient, kind and always ready to help.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/tutor" className="btn-neon btn-neon-hover inline-flex items-center gap-2">
            Ask Your First Question <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            View Dashboard
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
