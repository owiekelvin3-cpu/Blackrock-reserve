"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

type Variant = "compact" | "full";

interface LanguageSelectorProps {
  variant?: Variant;
  className?: string;
}

export default function LanguageSelector({ variant = "compact", className }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const select = (code: LocaleCode) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-text-primary transition-colors hover:border-accent-brand/30 hover:bg-accent-brand/5",
          variant === "compact" ? "px-2.5 py-2 text-sm min-h-[40px]" : "w-full px-4 py-3 text-sm"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.language")}
      >
        <Globe size={16} className="text-accent-brand shrink-0" />
        <span className="text-base leading-none">{current.flag}</span>
        {variant === "full" && (
          <span className="flex-1 text-left truncate">{current.nativeName}</span>
        )}
        {variant === "compact" && (
          <span className="hidden sm:inline truncate max-w-[5rem]">{current.nativeName}</span>
        )}
        <ChevronDown size={14} className={cn("text-text-muted shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute z-[100] mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-bg-elevated/98 backdrop-blur-xl shadow-2xl py-1",
            variant === "full" ? "left-0 right-0" : "right-0 w-56"
          )}
        >
          {LOCALES.map((loc) => (
            <li key={loc.code} role="option" aria-selected={loc.code === locale}>
              <button
                type="button"
                onClick={() => select(loc.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors hover:bg-white/5",
                  loc.code === locale && "bg-accent-brand/10 text-accent-brand"
                )}
              >
                <span className="text-lg leading-none">{loc.flag}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{loc.nativeName}</span>
                  <span className="block text-[10px] text-text-muted truncate">{loc.englishName}</span>
                </span>
                {loc.code === locale && <Check size={14} className="shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
