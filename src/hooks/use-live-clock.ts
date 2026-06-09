"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildGreetingMessage,
  getGreetingPeriod,
  resolveBrowserLocale,
  resolveBrowserTimezone,
  type GreetingPeriod,
} from "@/lib/greeting";

export type LiveClockState = {
  greeting: string;
  period: GreetingPeriod;
  dateLine: string;
  timeLine: string;
  timezone: string;
  locale: string;
};

function getHourInTimezone(now: Date, timezone: string, locale: string): number {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    if (Number.isFinite(hour)) return hour === 24 ? 0 : hour;
  } catch {
    /* fall through */
  }
  return now.getHours();
}

function formatClock(now: Date, timezone: string, locale: string) {
  const dateLine = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const timeLine = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const hour = getHourInTimezone(now, timezone, locale);
  return { dateLine, timeLine, hour };
}

function buildState(now: Date, timezone: string, locale: string, firstName: string | null): LiveClockState {
  const { dateLine, timeLine, hour } = formatClock(now, timezone, locale);
  const period = getGreetingPeriod(hour);
  return {
    greeting: buildGreetingMessage(period, firstName),
    period,
    dateLine,
    timeLine,
    timezone,
    locale,
  };
}

export function useLiveClock(firstName: string | null) {
  const timezone = useMemo(() => resolveBrowserTimezone(), []);
  const locale = useMemo(() => resolveBrowserLocale(), []);
  const firstNameRef = useRef(firstName);
  firstNameRef.current = firstName;

  const [clock, setClock] = useState<LiveClockState | null>(null);

  useEffect(() => {
    firstNameRef.current = firstName;
  }, [firstName]);

  useEffect(() => {
    const tick = () => {
      setClock(buildState(new Date(), timezone, locale, firstNameRef.current));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timezone, locale, firstName]);

  return { clock, timezone, locale, ready: clock !== null };
}
