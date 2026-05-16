"use client";

import { useEffect, useRef } from "react";

export default function FadeUp({
  delay = 0,
  className = "",
  children,
  triggerKey,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
  triggerKey?: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    el.style.transition = "none";
    void el.offsetHeight;
    requestAnimationFrame(() => {
      if (!el) return;
      el.style.transition = `opacity 0.2s ease-out ${delay}ms, transform 0.2s ease-out ${delay}ms`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }, [triggerKey, delay]);

  return (
    <div ref={ref} style={{ opacity: 0 }} className={className}>
      {children}
    </div>
  );
}
