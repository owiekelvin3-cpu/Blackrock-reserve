"use client";

const BRAND = "#ff5f05";
const MUTED = "#3a3a3a";

export function MiniLineChart({ className = "" }: { className?: string }) {
  const points = [20, 35, 28, 50, 42, 65, 58, 80];
  const w = 200;
  const h = 60;
  const max = Math.max(...points);
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (v / max) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full h-full ${className}`} preserveAspectRatio="none">
      <polyline
        points={coords}
        fill="none"
        stroke={BRAND}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MiniBarChart({ className = "" }: { className?: string }) {
  const values = [30, 45, 38, 62, 55, 90, 72];
  const w = 200;
  const h = 60;
  const max = Math.max(...values);
  const barW = w / values.length - 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full h-full ${className}`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const barH = (v / max) * (h - 8);
        const x = i * (barW + 4) + 2;
        const isPeak = v === max;
        return (
          <rect
            key={i}
            x={x}
            y={h - barH}
            width={barW}
            height={barH}
            rx="2"
            fill={isPeak ? BRAND : MUTED}
          />
        );
      })}
    </svg>
  );
}
