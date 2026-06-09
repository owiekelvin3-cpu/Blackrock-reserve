"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/features", label: "Feature" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/features#integration", label: "Integration" },
  { href: "/#blog", label: "Blog" },
];

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all btn-gold px-5 py-2.5 text-sm rounded-full";

function scrollToHash(href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return;

  const id = href.slice(hashIndex + 1);
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hash, setHash] = useState("");
  const pathname = usePathname();

  const syncHash = useCallback(() => {
    setHash(typeof window !== "undefined" ? window.location.hash : "");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    syncHash();
  }, [pathname, syncHash]);

  useEffect(() => {
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [syncHash]);

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [pathname, hash]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      return pathname === "/" && hash === href.slice(1);
    }
    if (href === "/") {
      return pathname === "/" && !hash;
    }
    if (href.includes("#")) {
      const [path, h] = href.split("#");
      return pathname === path && hash === `#${h}`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);

    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    const path = href.slice(0, hashIndex) || "/";
    if (pathname === path || (path === "/" && pathname === "/")) {
      window.setTimeout(() => scrollToHash(href), 0);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-5 sm:px-6 pointer-events-none">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 md:grid md:grid-cols-[auto_1fr_auto] md:gap-6 pointer-events-auto">
        <div className="relative z-20 shrink-0">
          <Logo />
        </div>

        <div className="hidden md:flex min-w-0 justify-center">
          <div className="glass-dock flex max-w-full items-center gap-0.5 overflow-x-auto px-2 py-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  isActive(link.href)
                    ? "bg-accent-brand/15 text-white border border-accent-brand/30 shadow-[0_0_20px_rgba(255,95,5,0.2)]"
                    : "text-text-secondary hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <ThemeToggle size="sm" className="hidden sm:inline-flex" />
          <Link href="/login" className="hidden md:inline-flex text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-2">
            Sign in
          </Link>
          <Link href="/register" className={cn(primaryLinkClass, "hidden md:inline-flex")}>
            Sign up <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            className="md:hidden p-2 text-text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-4 mx-auto max-w-7xl glass-card p-4 pointer-events-auto"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-accent-brand/15 text-accent-brand"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-text-secondary">Appearance</span>
                  <ThemeToggle size="sm" />
                </div>
                <Link
                  href="/login"
                  className="w-full text-center px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary rounded-full border border-white/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link href="/register" className={cn(primaryLinkClass, "w-full")} onClick={() => setMobileOpen(false)}>
                  Sign up <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
