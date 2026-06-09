"use client";

import { useMemo } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getChartTheme } from "@/lib/chart-theme";

export function useChartTheme() {
  const { theme } = useTheme();
  return useMemo(() => getChartTheme(theme), [theme]);
}
