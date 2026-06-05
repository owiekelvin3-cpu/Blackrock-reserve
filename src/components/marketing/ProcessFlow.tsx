"use client";

import { motion } from "framer-motion";
import { User, ShieldCheck, Network, Check } from "lucide-react";
import GlowIcon from "@/components/ui/GlowIcon";

const nodes = [
  { id: "holder", label: "Account Holder", icon: User, center: false },
  { id: "proof", label: "Verified Identity", icon: ShieldCheck, center: true },
  { id: "apps", label: "Smart Banking", icon: Network, center: false },
];

const connections = [
  { from: 0, to: 1, label: "Secure Protocol", action: "Authenticate" },
  { from: 1, to: 2, label: "Verified Access", action: "Unlock features" },
];

export default function ProcessFlow() {
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
          <span className="pill-label mb-4">How It Works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mt-4">
            From Sign-Up to <span className="gold-gradient-text">Secure Banking</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
            A seamless, encrypted flow that protects your identity while unlocking premium financial tools.
          </p>
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
                    <div className="absolute inset-[-24px] rounded-full bg-gradient-to-br from-accent-brand/30 via-accent-brand-red/20 to-transparent blur-3xl" />
                  )}
                  {!node.center && (
                    <div className={`absolute inset-[-16px] rounded-full blur-2xl ${i === 0 ? "bg-accent-brand/25" : "bg-accent-brand-red/20"}`} />
                  )}
                  <GlowIcon
                    icon={node.icon}
                    variant={node.center ? "hex" : "circle"}
                    size={node.center ? 26 : 22}
                  />
                </div>
                <span className="pill-label">{node.label}</span>
              </motion.div>

              {i < nodes.length - 1 && (
                <div className="flex flex-col items-center flex-1 px-4 min-w-[120px]">
                  <div className="flex items-center gap-2 text-[10px] text-text-muted mb-2 whitespace-nowrap">
                    <Check size={10} className="text-accent-brand" />
                    {connections[i].label}
                  </div>
                  <div className="flow-line w-full mb-2" />
                  <span className="text-xs text-accent-brand font-medium">{connections[i].action}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:hidden space-y-6">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              className="glow-card p-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="glow-card-inner flex items-center gap-4">
                <GlowIcon icon={node.icon} variant={node.center ? "hex" : "circle"} />
                <div>
                  <p className="font-semibold text-white">{node.label}</p>
                  {i < connections.length && (
                    <p className="text-xs text-accent-brand mt-1">{connections[i].action}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
