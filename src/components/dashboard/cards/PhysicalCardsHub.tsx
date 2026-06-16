"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronRight, CreditCard, Package, RefreshCw, Shield, Truck, AlertCircle, CheckCircle2, MapPin, Lock, BadgeCheck } from "lucide-react";
import type { PhysicalCardTier } from "@prisma/client";
import DashboardGate from "@/components/dashboard/DashboardGate";
import PhysicalCardPreview from "@/components/dashboard/cards/PhysicalCardPreview";
import CardTierSelector from "@/components/dashboard/cards/CardTierSelector";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { fetchDashboardJson } from "@/lib/fetch-json";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DashboardData = {
  eligibility: {
    eligible: boolean;
    items: { id: string; label: string; met: boolean; detail?: string }[];
    reason: string | null;
  };
  hasOpenRequest: boolean;
  activeRequest: ActiveRequest | null;
  history: ActiveRequest[];
  issuedCard: {
    id: string;
    maskedNumber: string;
    expiry: string;
    status: string;
    tierLabel: string;
    tier: PhysicalCardTier;
  } | null;
  tiers: { id: PhysicalCardTier; label: string; description: string; processingDays: number }[];
  pipeline: { status: string; label: string; etaDays: number | null }[];
};

type ActiveRequest = {
  id: string;
  cardTier: PhysicalCardTier;
  tierLabel: string;
  status: string;
  statusLabel: string;
  pipelineIndex: number | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  estimatedDeliveryDate: string | null;
  rejectionReason: string | null;
  statusEtaDays: number | null;
  address: { formatted: string };
  createdAt: string;
};

const FAQ = [
  {
    q: "How long does physical card delivery take?",
    a: "Standard cards ship in 7–10 business days after approval. Premium and Black Elite tiers receive priority production and courier delivery.",
  },
  {
    q: "Can I order more than one card?",
    a: "Only one physical card request can be active at a time. Once your card is delivered, contact support for replacements.",
  },
  {
    q: "What happens after I submit a request?",
    a: "Our card services team reviews your profile, verifies eligibility, produces your card, and ships it to your confirmed address. You can track every stage here.",
  },
  {
    q: "Is my card insured?",
    a: "Yes. Physical debit cards include fraud monitoring, zero-liability protection on unauthorized transactions, and 24/7 card security support.",
  },
];

export default function PhysicalCardsHub() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<ActiveRequest | null>(null);
  const [selectedTier, setSelectedTier] = useState<PhysicalCardTier>("STANDARD");
  const [form, setForm] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateRegion: "",
    postalCode: "",
    country: "US",
    deliveryInstructions: "",
  });

  const load = useCallback((silent = false) => {
    if (!silent) {
      setLoading(true);
      setLoadError(false);
    }
    fetchDashboardJson<DashboardData>("/api/dashboard/cards")
      .then(({ data: json, error }) => {
        if (error || !json) {
          if (!silent) setLoadError(true);
          return;
        }
        setData(json);
        setForm((f) => ({
          ...f,
          recipientName: f.recipientName || session?.user?.name || "",
        }));
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [session?.user?.name]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.eligibility.eligible || data.hasOpenRequest) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cardTier: selectedTier, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setConfirmed(json.request);
      toast.success(t("cards.order.submitted"));
      load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("cards.loadError"));
    } finally {
      setSubmitting(false);
    }
  };

  const active = data?.activeRequest;
  const showOrderForm =
    data && data.eligibility.eligible && !data.hasOpenRequest && !confirmed;

  return (
    <DashboardGate isLoading={loading}>
      <div className="physical-cards-page space-y-6 max-w-6xl">
        <header className="physical-cards-hero">
          <div className="relative z-[1]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-brand mb-2">
              {t("cards.badge")}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
              {t("cards.title")}{" "}
              <span className="gold-gradient-text">{t("cards.titleHighlight")}</span>
            </h1>
            <p className="text-sm sm:text-base text-text-secondary mt-3 max-w-2xl leading-relaxed">
              {t("cards.subtitle")}
            </p>
            <div className="physical-cards-trust">
              <span className="physical-cards-trust-item">
                <Shield size={13} />
                Bank-grade security
              </span>
              <span className="physical-cards-trust-item">
                <Lock size={13} />
                Encrypted delivery
              </span>
              <span className="physical-cards-trust-item">
                <BadgeCheck size={13} />
                Verified card services
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="physical-cards-refresh"
            aria-label={t("cards.retry")}
          >
            <RefreshCw size={16} />
          </button>
        </header>

        {loadError && (
          <div className="physical-cards-alert">
            <AlertCircle size={20} />
            <div>
              <p className="font-medium">{t("cards.loadError")}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => load()}>
                {t("cards.retry")}
              </Button>
            </div>
          </div>
        )}

        {data && (
          <>
            <section className="physical-cards-panel">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-accent-brand" />
                <h2 className="text-base font-semibold text-text-primary">{t("cards.requirements.title")}</h2>
              </div>
              <ul className="physical-cards-requirements">
                {data.eligibility.items.map((item) => (
                  <li key={item.id} className={cn("physical-cards-req", item.met && "physical-cards-req-met")}>
                    <span className="physical-cards-req-icon">
                      {item.met ? <Check size={14} /> : <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />}
                    </span>
                    <div>
                      <p className="text-sm text-text-primary">{item.label}</p>
                      {item.detail && <p className="text-xs text-text-muted mt-0.5">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
              {!data.eligibility.eligible && (
                <p className="text-xs text-accent-brand mt-4">{data.eligibility.reason}</p>
              )}
            </section>

            {(confirmed || active) && (
              <StatusTracker request={confirmed ?? active!} pipeline={data.pipeline} />
            )}

            {confirmed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="physical-cards-confirm"
              >
                <CheckCircle2 size={28} className="text-accent-green" />
                <div>
                  <h3 className="font-semibold text-text-primary">{t("cards.order.confirmTitle")}</h3>
                  <p className="text-sm text-text-secondary mt-1">{t("cards.order.confirmDesc")}</p>
                  <p className="text-xs text-text-muted mt-2 font-mono">Ref: {confirmed.id.slice(-8).toUpperCase()}</p>
                </div>
              </motion.div>
            )}

            {data.issuedCard && (
              <section className="physical-cards-panel">
                <p className="physical-cards-panel-title">Active card</p>
                <h2 className="physical-cards-panel-heading mb-5">{t("cards.issued.title")}</h2>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <PhysicalCardPreview
                    tier={data.issuedCard.tier}
                    cardholderName={session?.user?.name ?? ""}
                    lastFour={data.issuedCard.maskedNumber.slice(-4)}
                    size="hero"
                  />
                  <dl className="physical-cards-meta">
                    <div>
                      <dt>{t("cards.issued.status")}</dt>
                      <dd>{data.issuedCard.status.replace(/_/g, " ")}</dd>
                    </div>
                    <div>
                      <dt>{t("cards.issued.expiry")}</dt>
                      <dd>{data.issuedCard.expiry}</dd>
                    </div>
                    <div>
                      <dt>{t("cards.issued.tier")}</dt>
                      <dd>{data.issuedCard.tierLabel}</dd>
                    </div>
                  </dl>
                </div>
              </section>
            )}

            {showOrderForm && (
              <section className="physical-cards-panel">
                <p className="physical-cards-panel-title">Step 1</p>
                <h2 className="physical-cards-panel-heading">{t("cards.order.title")}</h2>
                <p className="physical-cards-panel-sub">{t("cards.order.subtitle")}</p>

                <div className="mt-6">
                  <CardTierSelector
                    selected={selectedTier}
                    onSelect={setSelectedTier}
                    cardholderName={form.recipientName || session?.user?.name || "CARDHOLDER"}
                  />
                </div>

                <div className="physical-cards-form-panel">
                  <p className="physical-cards-panel-title">Step 2</p>
                  <h3 className="physical-cards-form-heading">Confirm delivery details</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label={t("cards.order.recipientName")}
                        value={form.recipientName}
                        onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                        required
                      />
                      <Input
                        label={t("cards.order.phone")}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label={t("cards.order.addressLine1")}
                      value={form.addressLine1}
                      onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                      required
                    />
                    <Input
                      label={t("cards.order.addressLine2")}
                      value={form.addressLine2}
                      onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                    />
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Input
                        label={t("cards.order.city")}
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                      />
                      <Input
                        label={t("cards.order.state")}
                        value={form.stateRegion}
                        onChange={(e) => setForm({ ...form, stateRegion: e.target.value })}
                        required
                      />
                      <Input
                        label={t("cards.order.postalCode")}
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label={t("cards.order.instructions")}
                      value={form.deliveryInstructions}
                      onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })}
                      placeholder={t("cards.order.instructionsPlaceholder")}
                    />
                    <Button type="submit" isLoading={submitting} className="physical-cards-submit w-full sm:w-auto min-w-[220px]">
                      <CreditCard size={16} className="mr-2" />
                      {t("cards.order.submit")}
                    </Button>
                  </form>
                </div>
              </section>
            )}

            {!data.hasOpenRequest && !data.issuedCard && !showOrderForm && !confirmed && (
              <EmptyState eligible={data.eligibility.eligible} />
            )}

            {active?.trackingNumber && (
              <section className="physical-cards-panel">
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={18} className="text-accent-brand" />
                  <h2 className="text-base font-semibold">{t("cards.tracking.title")}</h2>
                </div>
                <p className="text-sm text-text-secondary">
                  {active.shippingCarrier ?? "Courier"} · {active.trackingNumber}
                </p>
              </section>
            )}

            {data.history.length > 0 && (
              <section className="physical-cards-panel">
                <h2 className="text-base font-semibold text-text-primary mb-4">{t("cards.history.title")}</h2>
                <div className="space-y-2">
                  {data.history.map((row) => (
                    <div key={row.id} className="physical-cards-history-row">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{row.tierLabel}</p>
                        <p className="text-xs text-text-muted">{new Date(row.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={cn("physical-cards-status-badge", `status-${row.status.toLowerCase()}`)}>
                        {row.statusLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="physical-cards-panel">
              <h2 className="text-base font-semibold text-text-primary mb-4">{t("cards.faq.title")}</h2>
              <div className="space-y-3">
                {FAQ.map((item) => (
                  <details key={item.q} className="physical-cards-faq">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardGate>
  );
}

function StatusTracker({
  request,
  pipeline,
}: {
  request: ActiveRequest;
  pipeline: { status: string; label: string; etaDays: number | null }[];
}) {
  const { t } = useI18n();
  const currentIndex = request.pipelineIndex ?? 0;
  const isRejected = request.status === "REJECTED";

  return (
    <section className="physical-cards-panel physical-cards-tracker">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{t("cards.tracker.title")}</h2>
          <p className="text-sm text-text-muted mt-1">
            {request.tierLabel} · {request.statusLabel}
          </p>
        </div>
        {request.statusEtaDays != null && !isRejected && (
          <span className="physical-cards-eta">
            ~{request.statusEtaDays} {t("cards.tracker.days")}
          </span>
        )}
      </div>

      {isRejected ? (
        <div className="physical-cards-rejected">
          <AlertCircle size={18} />
          <p>{request.rejectionReason ?? t("cards.tracker.rejected")}</p>
        </div>
      ) : (
        <ol className="physical-cards-timeline">
          {pipeline.map((step, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li
                key={step.status}
                className={cn(
                  "physical-cards-step",
                  done && "physical-cards-step-done",
                  current && "physical-cards-step-current"
                )}
              >
                <span className="physical-cards-step-dot">
                  {done ? <Check size={12} /> : index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.label}</p>
                  {current && step.etaDays && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {t("cards.tracker.estimated")} {step.etaDays} {t("cards.tracker.days")}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 flex items-start gap-2 text-xs text-text-muted">
        <MapPin size={14} className="shrink-0 mt-0.5" />
        <pre className="whitespace-pre-wrap font-sans">{request.address.formatted}</pre>
      </div>
    </section>
  );
}

function EmptyState({ eligible }: { eligible: boolean }) {
  const { t } = useI18n();
  return (
    <div className="physical-cards-empty">
      <Package size={32} className="text-text-muted" />
      <h3 className="font-semibold text-text-primary mt-4">{t("cards.empty.title")}</h3>
      <p className="text-sm text-text-muted mt-2 max-w-md text-center">
        {eligible ? t("cards.empty.eligible") : t("cards.empty.notEligible")}
      </p>
      {!eligible && (
        <Link href="/dashboard/settings" className="text-sm text-accent-brand mt-4 inline-flex items-center gap-1">
          {t("cards.empty.settings")} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
