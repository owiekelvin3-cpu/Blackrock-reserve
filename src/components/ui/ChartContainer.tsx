"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  className?: string;
  children: React.ReactNode;
}

export default function ChartContainer({ className, children }: ChartContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("min-h-[120px] min-w-0 w-full", className)} aria-hidden />;
  }

  return (
    <div className={cn("min-h-0 min-w-0 w-full", className)} style={{ minWidth: 0 }}>
      {children}
    </div>
  );
}
