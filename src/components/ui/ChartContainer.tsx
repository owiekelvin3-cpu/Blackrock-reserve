"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  className?: string;
  children: React.ReactNode;
}

export default function ChartContainer({ className, children }: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const { width, height } = el.getBoundingClientRect();
      setReady(width > 0 && height > 0);
    };

    check();
    const raf = requestAnimationFrame(check);
    const fallback = window.setTimeout(() => setReady(true), 150);
    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("min-h-0 min-w-0 w-full", className)}
      style={{ minWidth: 0 }}
    >
      {ready ? children : <div className="h-full w-full" aria-hidden />}
    </div>
  );
}
