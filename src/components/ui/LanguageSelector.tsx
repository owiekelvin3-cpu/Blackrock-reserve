"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useHydrated } from "@/hooks/use-hydrated";
import { LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

type Variant = "compact" | "full";

interface LanguageSelectorProps {
  variant?: Variant;
  className?: string;
}

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const COMPACT_MENU_WIDTH = 224;
const MENU_GAP = 8;
const VIEWPORT_PADDING = 8;

export default function LanguageSelector({ variant = "compact", className }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = variant === "full" ? rect.width : COMPACT_MENU_WIDTH;
    let left = variant === "full" ? rect.left : rect.right - width;
    left = Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - width - VIEWPORT_PADDING));

    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const spaceAbove = rect.top - VIEWPORT_PADDING;
    const preferredMaxHeight = 288;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      preferredMaxHeight,
      openUpward ? spaceAbove - MENU_GAP : spaceBelow - MENU_GAP
    );
    const top = openUpward
      ? Math.max(VIEWPORT_PADDING, rect.top - MENU_GAP - maxHeight)
      : rect.bottom + MENU_GAP;

    setMenuPosition({ top, left, width, maxHeight });
  }, [variant]);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onLayoutChange = () => updateMenuPosition();

    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);
    document.addEventListener("mousedown", close);

    return () => {
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
      document.removeEventListener("mousedown", close);
    };
  }, [open, updateMenuPosition]);

  const select = (code: LocaleCode) => {
    setLocale(code);
    setOpen(false);
  };

  const menu =
    open && menuPosition && mounted
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            className="fixed z-[10000] overflow-y-auto rounded-xl border border-white/10 bg-bg-elevated/98 backdrop-blur-xl shadow-2xl py-1"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
            }}
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
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) {
              requestAnimationFrame(() => updateMenuPosition());
            }
            return next;
          });
        }}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-text-primary transition-colors hover:border-accent-brand/30 hover:bg-accent-brand/5",
          variant === "compact" ? "px-2.5 py-2 text-sm min-h-[40px]" : "w-full px-4 py-3 text-sm"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.language")}
      >
        <Globe size={16} className="text-accent-brand shrink-0" />
        <span className="text-base leading-none" suppressHydrationWarning>
          {hydrated ? current.flag : " "}
        </span>
        {variant === "full" && (
          <span className="flex-1 text-left truncate" suppressHydrationWarning>
            {hydrated ? current.nativeName : ""}
          </span>
        )}
        {variant === "compact" && (
          <span className="hidden sm:inline truncate max-w-[5rem]" suppressHydrationWarning>
            {hydrated ? current.nativeName : ""}
          </span>
        )}
        <ChevronDown size={14} className={cn("text-text-muted shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {menu}
    </div>
  );
}
