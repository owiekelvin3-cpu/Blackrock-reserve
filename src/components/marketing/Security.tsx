"use client";

import { motion } from "framer-motion";
import { Shield, Fingerprint, Lock } from "lucide-react";
import GlowIcon from "@/components/ui/GlowIcon";

const securityFeatures = [
  "256-bit AES encryption on all data",
  "Multi-factor authentication (2FA)",
  "Biometric login support",
  "Real-time fraud monitoring",
  "FDIC insurance up to $250,000",
  "SOC 2 Type II certified infrastructure",
];

export default function Security() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="pill-label mb-4">Security</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-4">
              Security You Can <span className="gold-gradient-text">Trust</span>
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              Your assets are protected by the same standards used by the world&apos;s largest financial institutions.
            </p>
            <ul className="mt-8 space-y-4">
              {securityFeatures.map((feature, i) => (
                <motion.li
                  key={feature}
                  className="flex items-stretch gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="accent-bar shrink-0 self-stretch min-h-[2.5rem]" />
                  <span className="text-text-secondary text-sm py-1">{feature}</span>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3 flex-wrap">
              {["FDIC", "FinCEN", "PCI DSS"].map((badge) => (
                <span key={badge} className="pill-label text-accent-brand border-accent-brand/30">{badge}</span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="glow-card p-10 relative w-full max-w-md">
              <div className="light-leak light-leak-orange w-40 h-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60" />
              <div className="glow-card-inner flex flex-col items-center gap-8">
                <GlowIcon icon={Shield} variant="hex" size={32} />
                <div className="grid grid-cols-3 gap-6 w-full">
                  {[Fingerprint, Lock, Shield].map((Icon, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="icon-ring h-12 w-12">
                        <Icon size={18} className="text-accent-brand" strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] text-text-muted text-center">
                        {["Biometric", "Encrypted", "Protected"][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-accent-brand/50 to-transparent" />
                <p className="text-xs text-text-muted text-center">Zero-knowledge architecture for sensitive data</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
