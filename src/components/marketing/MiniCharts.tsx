"use client";

import RevenueFlowChart from "@/components/charts/RevenueFlowChart";

function ChartPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full h-full min-h-[5rem] rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center ${className}`}
    >
      <div className="h-px w-3/4 bg-white/10" />
    </div>
  );
}

export function MiniLineChart({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  void animate;
  return <ChartPlaceholder className={className} />;
}

export function MiniBarChart({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  void animate;
  return <ChartPlaceholder className={className} />;
}

export function RevenueBarChart({
  className = "",
  animate = false,
  emptyLabel,
}: {
  className?: string;
  animate?: boolean;
  emptyLabel?: string;
}) {
  return (
    <RevenueFlowChart
      className={className}
      animate={animate}
      data={[]}
      emptyLabel={emptyLabel}
    />
  );
}
