"use client";

import { motion } from "framer-motion";
import { User, ShieldCheck, Network, Check } from "lucide-react";
import GlowIcon from "@/components/ui/GlowIcon";
import { useI18n } from "@/components/providers/I18nProvider";

export default function ProcessFlow() {
  const { t } = useI18n();

  const nodes = [
    { id: "holder", label: t("processFlow.accountHolder"), icon: User, center: false },
    { id: "proof", label: t("processFlow.verifiedIdentity"), icon: ShieldCheck, center: true },
    { id: "apps", label: t("processFlow.smartBanking"), icon: Network, center: false },
  ];

  const connections = [
    { from: 0, to: 1, label: t("processFlow.secureProtocol"), action: t("processFlow.authenticate") },
    { from: 1, to: 2, label: t("processFlow.verifiedAccess"), action: t("processFlow.unlockFeatures") },
  ];

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="neon-streak top-1/2 left-[-10%] w-[120%] h-32 opacity-30" />

      <div className="mx-auto max-w-7xl relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="pill-label mb-4">{t("processFlow.badge")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mt-4">
            {t("processFlow.title")}{" "}
            <span className="gold-gradient-text">{t("processFlow.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl mx-auto">{t("processFlow.subtitle")}</p>
        </motion.div>

        <div className="hidden lg:flex items-center justify-center gap-0 px-8">
          {nodes.map((node, i) => (
            <div key={node.id} className="flex items-center flex-1 max-w-xs">
              <motion.div
                className="flex flex-col items-center flex-1"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="relative mb-6">
                  {node.center && (
                    <div className="absolute inset-0 rounded-full bg-accent-brand/20 blur-2xl scale-150" />
                  )}
                  <GlowIcon icon={node.icon} size={28} />
                  {node.center && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-green flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-white text-center">{node.label}</p>
              </motion.div>

              {i < connections.length && (
                <div className="flex flex-col items-center px-4 min-w-[140px]">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-brand/40 to-transparent mb-2" />
                  <p className="text-[10px] uppercase tracking-wider text-text-muted text-center">{connections[i].label}</p>
                  <span className="mt-1 text-[10px] text-accent-brand font-medium">{connections[i].action}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:hidden grid gap-6 sm:grid-cols-3">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              className="glass-card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlowIcon icon={node.icon} size={22} className="mx-auto mb-4" />
              <p className="text-sm font-semibold text-white">{node.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
