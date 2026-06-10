"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ChartContainer from "@/components/ui/ChartContainer";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn, formatCurrency } from "@/lib/utils";

export type CashFlowMonth = {
  month: string;
  value: number;
  inflow: number;
  outflow: number;
  tooltipDate: string;
};

const DISPLAY_MONTHS = 7;
const INACTIVE_BAR = "#2a2a2e";
const INACTIVE_BAR_BOTTOM = "#1c1c1f";

type ChartMode = "monthly" | "yearly";

type CashFlowBarProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  month?: string;
  payload?: CashFlowMonth;
  activeMonth: string;
};

const MIN_BAR_HEIGHT = 10;

function CashFlowBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  month,
  payload,
  activeMonth,
}: CashFlowBarProps) {
  if (width <= 0) return null;

  const barMonth = month ?? payload?.month;
  const isActive = barMonth === activeMonth;
  const barHeight = Math.max(height, MIN_BAR_HEIGHT);
  const barY = height < MIN_BAR_HEIGHT ? y + height - MIN_BAR_HEIGHT : y;
  const r = Math.min(12, barHeight / 2, width / 2);

  return (
    <g className={cn("cash-flow-bar", isActive && "cash-flow-bar-active")}>
      <path
        d={`M ${x} ${barY + r} Q ${x} ${barY} ${x + r} ${barY} L ${x + width - r} ${barY} Q ${x + width} ${barY} ${x + width} ${barY + r} L ${x + width} ${barY + barHeight} L ${x} ${barY + barHeight} Z`}
        fill={isActive ? "url(#cf-bar-active)" : "url(#cf-bar-inactive)"}
        style={{ cursor: "pointer" }}
      />
      {isActive && barHeight >= MIN_BAR_HEIGHT && (
        <>
          <circle
            cx={x + width / 2}
            cy={barY}
            r={7}
            fill="rgba(255, 95, 5, 0.4)"
            className="cash-flow-bar-glow"
          />
          <circle
            cx={x + width / 2}
            cy={barY}
            r={4}
            fill="#ffffff"
            stroke="#FF5F05"
            strokeWidth={1.5}
          />
        </>
      )}
    </g>
  );
}

function CashFlowTooltip({
  active,
  payload,
  labels,
}: {
  active?: boolean;
  payload?: { payload: CashFlowMonth }[];
  labels: { cashFlow: string; inflow: string; outflow: string };
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as CashFlowMonth;
  const netCashFlow = row.inflow - row.outflow;

  return (
    <motion.div
      className="cash-flow-tooltip"
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="cash-flow-tooltip-date">{row.tooltipDate}</p>
      <div className="cash-flow-tooltip-row">
        <span>{labels.cashFlow}</span>
        <span className="cash-flow-tooltip-value">{formatCurrency(netCashFlow)}</span>
      </div>
      <div className="cash-flow-tooltip-row">
        <span>{labels.inflow}</span>
        <span className="cash-flow-tooltip-value">{formatCurrency(row.inflow)}</span>
      </div>
      <div className="cash-flow-tooltip-row">
        <span>{labels.outflow}</span>
        <span className="cash-flow-tooltip-value cash-flow-tooltip-outflow">
          {row.outflow > 0 ? `-${formatCurrency(row.outflow)}` : formatCurrency(0)}
        </span>
      </div>
      <div className="cash-flow-tooltip-tail" />
    </motion.div>
  );
}

function buildYAxis(yMax: number) {
  const step = yMax / 5;
  const ticks = Array.from({ length: 6 }, (_, i) => Math.round(i * step));
  return { yMax, ticks };
}

export default function CashFlowPanel({
  data,
}: {
  data: CashFlowMonth[];
}) {
  const { t } = useI18n();
  const [chartMode, setChartMode] = useState<ChartMode>("yearly");
  const [activeMonth, setActiveMonth] = useState(() => {
    const peak = [...data].sort((a, b) => b.value - a.value)[0];
    return peak?.month ?? data[0]?.month ?? "Jan";
  });

  const chartData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const start = Math.max(0, currentMonth - (DISPLAY_MONTHS - 1));
    return data.slice(start, currentMonth + 1);
  }, [data]);

  const cashFlowTotal = useMemo(
    () =>
      chartMode === "yearly"
        ? data.reduce((s, m) => s + m.value, 0)
        : chartData.reduce((s, m) => s + m.value, 0),
    [data, chartData, chartMode]
  );

  const { yMax, ticks: yTicks } = useMemo(() => {
    const peak = Math.max(...chartData.map((m) => m.value), 0);
    if (peak === 0) return buildYAxis(50000);
    const step = 10000;
    const scaled = Math.ceil(peak / step) * step;
    return buildYAxis(Math.max(scaled, step));
  }, [chartData]);

  const hasActivity = chartData.some((m) => m.value > 0);

  const tooltipLabels = useMemo(
    () => ({
      cashFlow: t("dashboard.cashFlow"),
      inflow: t("dashboard.inflow"),
      outflow: t("dashboard.outflow"),
    }),
    [t]
  );

  const renderBar = useCallback(
    (props: CashFlowBarProps) => <CashFlowBarShape {...props} activeMonth={activeMonth} />,
    [activeMonth]
  );

  const handleBarInteraction = useCallback((entry: unknown) => {
    const raw = entry as CashFlowMonth & { payload?: CashFlowMonth };
    const row = raw?.month ? raw : raw?.payload;
    if (row?.month) setActiveMonth(row.month);
  }, []);

  return (
    <motion.div
      className="cash-flow-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cash-flow-card-glow" aria-hidden />

      <div className="cash-flow-header">
        <div className="cash-flow-header-main">
          <p className="cash-flow-label">{t("dashboard.cashFlow")}</p>
          <p className="cash-flow-total">{formatCurrency(cashFlowTotal)}</p>
        </div>
        <div className="cash-flow-toggle" role="group" aria-label="Cash flow period">
          <button
            type="button"
            onClick={() => setChartMode("monthly")}
            className={cn("cash-flow-toggle-btn", chartMode === "monthly" && "cash-flow-toggle-btn-active")}
          >
            {t("dashboard.monthly")}
          </button>
          <button
            type="button"
            onClick={() => setChartMode("yearly")}
            className={cn("cash-flow-toggle-btn", chartMode === "yearly" && "cash-flow-toggle-btn-active")}
          >
            {t("dashboard.yearly")}
          </button>
        </div>
      </div>

      <ChartContainer className="cash-flow-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 4, left: -4, bottom: 0 }}
            barCategoryGap="26%"
          >
            <defs>
              <linearGradient id="cf-bar-active" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7A3D" />
                <stop offset="45%" stopColor="#FF5F05" />
                <stop offset="100%" stopColor="#C94A00" />
              </linearGradient>
              <linearGradient id="cf-bar-inactive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INACTIVE_BAR} />
                <stop offset="100%" stopColor={INACTIVE_BAR_BOTTOM} />
              </linearGradient>
              <filter id="cf-bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF5F05" floodOpacity="0.25" />
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
              tickFormatter={(v) => `${Number(v) / 1000}k`}
              domain={[0, yMax]}
              ticks={yTicks}
              width={40}
            />
            <Tooltip
              content={<CashFlowTooltip labels={tooltipLabels} />}
              cursor={{ fill: "rgba(255, 95, 5, 0.06)", radius: 8 }}
              animationDuration={200}
            />
            <Bar
              dataKey="value"
              maxBarSize={56}
              minPointSize={MIN_BAR_HEIGHT}
              shape={renderBar as never}
              isAnimationActive
              animationBegin={80}
              animationDuration={900}
              animationEasing="ease-out"
              onClick={handleBarInteraction}
              onMouseEnter={handleBarInteraction}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {!hasActivity && (
        <p className="cash-flow-empty-hint">{t("dashboard.noCashFlowDesc")}</p>
      )}
    </motion.div>
  );
}
