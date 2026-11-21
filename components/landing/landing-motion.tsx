"use client";

import { inView, stagger } from "motion";
import { animate } from "motion/mini";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { landingPreviews, previewIntervalMs } from "@/lib/landing-preview";

const motionQuery = "(prefers-reduced-motion: no-preference)";

function subscribeToMotion(listener: () => void) {
  const preference = window.matchMedia(motionQuery);
  preference.addEventListener("change", listener);
  return () => preference.removeEventListener("change", listener);
}

const PreviewContext = createContext({
  sample: landingPreviews[0],
  playing: false,
});

export function useLandingPreview() {
  return useContext(PreviewContext);
}

export function LandingMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const playing = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((index) => (index + 1) % landingPreviews.length);
    }, previewIntervalMs);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const accounts = scope.current?.querySelector("[data-accounts-preview]");
    if (!playing || !accounts) return;

    let animation: ReturnType<typeof animate> | undefined;
    const stop = inView(
      accounts,
      () => {
        animation = animate(
          accounts.querySelectorAll("[data-account-row]"),
          { transform: ["translateY(12px)", "translateY(0px)"] },
          { duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: stagger(0.07) },
        );
      },
      { amount: 0.55 },
    );

    return () => {
      stop();
      animation?.cancel();
    };
  }, [playing]);

  return (
    <PreviewContext value={{ sample: landingPreviews[index], playing }}>
      <div ref={scope}>{children}</div>
    </PreviewContext>
  );
}
