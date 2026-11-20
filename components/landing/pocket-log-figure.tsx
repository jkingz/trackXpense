"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

export function PocketLogFigure({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLElement>();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const receipt = animate(
      "[data-pocket-receipt]",
      { y: [16, 0] },
      { duration: 0.4, ease: "easeOut" },
    );
    const badge = animate(
      "[data-pocket-badge]",
      { y: [8, 0], scale: [0.92, 1] },
      { delay: 0.13, duration: 0.28, ease: "easeOut" },
    );

    return () => {
      receipt.complete();
      badge.complete();
    };
  }, [animate, reduceMotion]);

  return (
    <figure ref={scope} id="inside" className="min-w-0">
      {children}
    </figure>
  );
}
