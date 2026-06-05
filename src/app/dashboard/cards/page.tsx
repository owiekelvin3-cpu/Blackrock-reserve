"use client";

import { useEffect, useState } from "react";
import { Plus, Snowflake, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DashboardGate from "@/components/dashboard/DashboardGate";
import { fetchJson } from "@/lib/fetch-json";

interface VirtualCard {
  id: string;
  name: string;
  last4: string;
  brand: string;
  status: string;
}

export default function CardsPage() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<{ cards: VirtualCard[] }>("/api/dashboard/cards")
      .then((json) => setCards(json?.cards ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardGate
      isLoading={loading}
      isEmpty={cards.length === 0}
      emptyTitle="No virtual cards"
      emptyDescription="Issue a virtual card to start making secure online payments."
    >
      <>
        <div className="flex justify-end mb-6">
          <Button size="sm" disabled><Plus size={16} /> Issue New Card</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id}>
              <div
                className="rounded-2xl p-6 mb-4 aspect-[1.6/1] flex flex-col justify-between relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #ff5f05 0%, #ff4500 50%, #cc0000 100%)" }}
              >
                <div className="absolute inset-0 border border-accent-brand/20 rounded-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xs text-white/80 uppercase tracking-wider">{card.brand}</span>
                  <Badge variant={card.status === "active" ? "green" : "blue"}>{card.status}</Badge>
                </div>
                <div className="relative z-10">
                  <p className="font-mono text-xl tracking-[0.3em] text-white">•••• •••• •••• {card.last4}</p>
                  <p className="text-sm text-white/70 mt-2">{card.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1"><Eye size={14} /> Details</Button>
                <Button variant="ghost" size="sm" className="flex-1"><Snowflake size={14} /> {card.status === "frozen" ? "Unfreeze" : "Freeze"}</Button>
              </div>
            </div>
          ))}
        </div>
      </>
    </DashboardGate>
  );
}
