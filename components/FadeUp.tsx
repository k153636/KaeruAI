"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useLayoutEffect, useRef } from "react";

type Props = {
  as?: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  triggerKey?: string | number;
  [key: string]: any;
};

export default function FadeUp({
  as: Tag = "div",
  delay = 0,
  className = "",
  style,
  children,
  triggerKey,
  ...rest
}: Props) {
  const ref = useRef<any>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition = "none";
  }, [triggerKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!el) return;
        el.style.transition = `opacity 0.2s ease-out ${delay}ms, transform 0.2s ease-out ${delay}ms`;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [triggerKey, delay]);

  const AnyTag = Tag as any;
  return (
    <AnyTag ref={ref} className={className} style={{ ...style, opacity: 0, transform: "translateY(18px)" }} {...rest}>
      {children}
    </AnyTag>
  );
}
