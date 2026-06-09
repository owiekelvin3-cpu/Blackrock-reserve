import type { Metadata } from "next";
import Providers from "@/components/providers/Providers";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('br-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BlackrockReserve",
    template: "%s | BlackrockReserve",
  },
  description:
    "Premium digital banking, smart investments, and wealth management for high-net-worth individuals and modern investors.",
  keywords: ["banking", "investments", "wealth management", "fintech", "digital bank"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "BlackrockReserve",
    title: "BlackrockReserve",
    description:
      "Premium digital banking, smart investments, and wealth management for high-net-worth individuals and modern investors.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlackrockReserve",
    description: "Premium digital banking, smart investments, and wealth management.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased bg-bg-primary font-sans">
        <div className="page-glow" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
