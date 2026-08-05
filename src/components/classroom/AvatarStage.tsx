import { motion } from "framer-motion";
import { GraduationCap, Volume2, VolumeX, Hand } from "lucide-react";

type Props = {
  speaking: boolean;
  label: string;
  caption: string;
  onToggleVoice: () => void;
  voiceOn: boolean;
};

/** Animated AI avatar teacher — lip-sync pulse, gestures, eye movement, live captions. */
export function AvatarStage({ speaking, label, caption, onToggleVoice, voiceOn }: Props) {
  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        animate={speaking ? { y: [0, -6, 0] } : { y: [0, -10, 0] }}
        transition={{ duration: speaking ? 1.2 : 3.5, repeat: Infinity }}
        className="relative"
      >
        {/* gesture hand */}
        <motion.div
          animate={speaking ? { rotate: [-8, 12, -8], y: [0, -4, 0] } : { rotate: 0 }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="absolute -right-6 top-16 rounded-full glass p-2 text-[#FF4FD9]"
          aria-hidden
        >
          <Hand className="h-4 w-4" />
        </motion.div>

        <motion.div
          animate={{
            boxShadow: speaking
              ? [
                  "0 0 40px rgba(255,79,217,0.35)",
                  "0 0 80px rgba(255,79,217,0.65)",
                  "0 0 40px rgba(255,79,217,0.35)",
                ]
              : "0 0 30px rgba(99,102,241,0.35)",
          }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="h-40 w-40 rounded-full bg-gradient-to-br from-[#FF4FD9] via-[#A855F7] to-[#6366F1] flex items-center justify-center"
        >
          <div className="relative h-32 w-32 rounded-full bg-[#120F33] flex flex-col items-center justify-center overflow-hidden">
            {/* eyes */}
            <div className="flex gap-5">
              {[0, 1].map((i) => (
                <motion.span
                  key={i}
                  animate={{ x: [-2, 2, -2], scaleY: [1, 0.15, 1] }}
                  transition={{
                    x: { duration: 3.6, repeat: Infinity },
                    scaleY: { duration: 4.2, repeat: Infinity, times: [0, 0.05, 0.1] },
                  }}
                  className="block h-2.5 w-2.5 rounded-full bg-white"
                />
              ))}
            </div>
            {/* smiling / talking mouth */}
            <motion.div
              animate={
                speaking
                  ? { height: [4, 14, 6, 12, 4], width: [22, 16, 24, 18, 22] }
                  : { height: 6, width: 26 }
              }
              transition={{ duration: 0.6, repeat: Infinity }}
              className="mt-4 rounded-b-full rounded-t-sm bg-[#FF4FD9]"
            />
            <GraduationCap className="absolute -top-1 h-8 w-8 text-white/70" />
          </div>
        </motion.div>

        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full glass px-3 py-1 text-xs text-white">
          {label}
        </div>
      </motion.div>

      <button
        onClick={onToggleVoice}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white hover:bg-white/10"
      >
        {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        {voiceOn ? "Voice on" : "Voice off"}
      </button>

      {caption && (
        <motion.div
          key={caption.slice(0, 40)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 glass rounded-2xl px-5 py-3 text-center text-sm text-white/90"
        >
          {caption}
        </motion.div>
      )}
    </div>
  );
}
