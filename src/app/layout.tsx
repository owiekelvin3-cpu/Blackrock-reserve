import type { Metadata } from "next";
import Providers from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platinum Crest Bank | Premium Digital Banking & Investments",
  description:
    "Premium digital banking, smart investments, and wealth management for high-net-worth individuals and modern investors.",
  keywords: ["banking", "investments", "wealth management", "fintech", "digital bank"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg-primary font-sans">
        <div className="page-glow" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
