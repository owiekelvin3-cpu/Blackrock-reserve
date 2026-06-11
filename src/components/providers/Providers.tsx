"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import NotificationAudioUnlock from "@/components/providers/NotificationAudioUnlock";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ChatProvider } from "@/components/providers/ChatProvider";
import type { LocaleCode } from "@/lib/i18n/locales";

export default function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: LocaleCode;
}) {
  return (
    <ThemeProvider>
      <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
        <I18nProvider initialLocale={initialLocale}>
        <ChatProvider>
        <NotificationAudioUnlock />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            },
          }}
        />
        </ChatProvider>
        </I18nProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
