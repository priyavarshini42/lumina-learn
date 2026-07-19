import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function SectionHeader({
  eyebrow,
  title,
  description,
  center,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 ${center ? "text-center mx-auto max-w-2xl" : ""}`}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4FD9]/30 bg-[#FF4FD9]/10 px-3 py-1 text-xs uppercase tracking-widest text-[#FF4FD9]">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
        {title.split("*").map((chunk, i) =>
          i % 2 === 1 ? (
            <span key={i} className="text-gradient">
              {chunk}
            </span>
          ) : (
            <span key={i}>{chunk}</span>
          ),
        )}
      </h2>
      {description && <p className="mt-3 text-white/70">{description}</p>}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`glass rounded-2xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <div className="text-3xl font-bold text-gradient">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{label}</div>
    </div>
  );
}
