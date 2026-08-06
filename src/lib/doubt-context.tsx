import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DoubtContextValue = {
  /** Live context (chapter / topic being taught) so answers stay on-topic. */
  topic: string | null;
  setTopic: (topic: string | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Prefilled question the panel should pick up when it opens. */
  prefill: string;
  ask: (question?: string) => void;
};

const DoubtContext = createContext<DoubtContextValue | null>(null);

export function DoubtProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState("");

  const ask = useCallback((question?: string) => {
    setPrefill(question ?? "");
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ topic, setTopic, open, setOpen, prefill, ask }),
    [topic, open, prefill, ask],
  );

  return <DoubtContext.Provider value={value}>{children}</DoubtContext.Provider>;
}

export function useDoubt(): DoubtContextValue {
  const ctx = useContext(DoubtContext);
  if (!ctx) throw new Error("useDoubt must be used inside <DoubtProvider>");
  return ctx;
}
