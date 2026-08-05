import { useCallback, useEffect, useRef, useState } from "react";

/** Browser text-to-speech with speaking state, used to drive avatar lip-sync. */
export function useSpeech(locale: string, rate = 1) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = locale;
      u.rate = rate;
      u.pitch = 1.05;
      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang === locale) ??
        window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(locale.split("-")[0]!));
      if (voice) u.voice = voice;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [locale, rate],
  );

  useEffect(() => stop, [stop]);

  return { speak, stop, speaking, supported };
}
