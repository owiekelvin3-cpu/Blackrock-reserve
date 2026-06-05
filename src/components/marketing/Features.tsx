"use client";

import { motion } from "framer-motion";
import {
  Brain, Mic, BarChart3, Shield, Globe, Sparkles,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { CHART_BRAND, CHART_MUTED } from "@/lib/chart-theme";
import ChartContainer from "@/components/ui/ChartContainer";
import GlowIcon from "@/components/ui/GlowIcon";

const miniChartData = [
  { v: 30 }, { v: 45 }, { v: 38 }, { v: 62 }, { v: 55 }, { v: 78 }, { v: 90 },
];

const topFeatures = [
  {
    icon: Brain,
    title: "AI Automation",
    description: "Intelligent workflows that optimize your cash flow, savings, and investment decisions automatically.",
  },
  {
    icon: Mic,
    title: "Voice Banking",
    description: "Execute transfers, check balances, and manage accounts hands-free with natural voice commands.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "2FA, biometrics, and real-time fraud detection powered by advanced AI monitoring.",
  },
];

const bottomFeatures = [
  {
    icon: Globe,
    title: "Global Transfers",
    description: "Send money to 50+ countries with competitive rates and real-time tracking.",
    hasChart: false,
  },
  {
    icon: BarChart3,
    title: "Data Visualization",
    description: "Real-time portfolio analytics with institutional-grade charting and insights.",
    hasChart: true,
  },
];

export default function Features() {
  return (
    <section className="section-padding relative">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="pill-label mb-4">
            <Sparkles size={12} className="inline mr-1.5 text-accent-brand" />
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mt-4">
            Everything You Need to{" "}
            <span className="gold-gradient-text">Grow Your Wealth</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
            A complete financial ecosystem with AI-powered tools for modern investors.
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {topFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glow-card hover-lift p-6 sm:p-8 relative"
              >
                <div className="light-leak light-leak-orange w-24 h-24 -top-4 -right-4 opacity-40" />
                <div className="glow-card-inner">
                  <GlowIcon icon={feature.icon} size={20} className="mb-5" />
                  <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {bottomFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glow-card hover-lift p-6 sm:p-8 relative"
              >
                <div className="light-leak light-leak-red w-32 h-32 -bottom-8 -right-8 opacity-30" />
                <div className="glow-card-inner flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <GlowIcon icon={feature.icon} size={20} className="mb-5" />
                    <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                  </div>
                  {feature.hasChart && (
                    <ChartContainer className="flex-1 h-32 sm:h-auto min-h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={miniChartData} barCategoryGap="25%">
                          <Bar dataKey="v" fill={CHART_MUTED} radius={[3, 3, 0, 0]} activeBar={{ fill: CHART_BRAND }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
