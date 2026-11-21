"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { currencySymbol, formatMoney } from "@/lib/money";
import { useLandingPreview } from "@/components/landing/landing-motion";

export function PreviewAmount({
  amount,
  withoutSymbol = false,
}: {
  amount: number;
  withoutSymbol?: boolean;
}) {
  const { playing } = useLandingPreview();
  const node = useRef<HTMLSpanElement>(null);
  const number = useRef({ value: amount });
  const [initial] = useState(amount);
  const symbolLength = withoutSymbol ? currencySymbol.PHP.length : 0;

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const current = number.current;
    const renderAmount = () => {
      element.textContent = formatMoney(current.value, "PHP").slice(symbolLength);
    };

    if (!playing) {
      current.value = amount;
      renderAmount();
      return;
    }
    if (current.value === amount) return;

    const tween = gsap.to(current, {
      value: amount,
      duration: 0.62,
      ease: "power2.inOut",
      onUpdate: renderAmount,
    });
    return () => {
      tween.kill();
    };
  }, [amount, playing, symbolLength]);

  return (
    <span ref={node} data-landing-amount={withoutSymbol ? "" : undefined}>
      {formatMoney(initial, "PHP").slice(symbolLength)}
    </span>
  );
}
