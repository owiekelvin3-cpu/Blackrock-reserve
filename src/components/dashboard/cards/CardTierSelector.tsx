"use client";

import type { PhysicalCardTier } from "@prisma/client";
import { Check, Clock } from "lucide-react";
import { CARD_TIER_CONFIG } from "@/lib/physical-cards-constants";
import PhysicalCardPreview from "@/components/dashboard/cards/PhysicalCardPreview";
import { cn } from "@/lib/utils";

const TIERS: PhysicalCardTier[] = ["STANDARD", "PREMIUM", "BLACK_ELITE"];

type Props = {
  selected: PhysicalCardTier;
  onSelect: (tier: PhysicalCardTier) => void;
  cardholderName: string;
};

export default function CardTierSelector({ selected, onSelect, cardholderName }: Props) {
  const active = CARD_TIER_CONFIG[selected];

  return (
    <div className="pc-tier-selector">
      <div className="pc-tier-showcase">
        <div className="pc-tier-showcase-glow" data-tier={selected} aria-hidden />
        <PhysicalCardPreview
          tier={selected}
          cardholderName={cardholderName}
          size="hero"
          selected
        />
        <div className="pc-tier-showcase-meta">
          <p className="pc-tier-showcase-title">{active.label}</p>
          <p className="pc-tier-showcase-desc">{active.description}</p>
          <ul className="pc-tier-benefits">
            {active.benefits.map((benefit) => (
              <li key={benefit}>
                <Check size={14} strokeWidth={2.5} />
                {benefit}
              </li>
            ))}
          </ul>
          <p className="pc-tier-shipping">
            <Clock size={14} />
            Ships in {active.processingDays} business days after approval
          </p>
        </div>
      </div>

      <div className="pc-tier-grid" role="radiogroup" aria-label="Choose your card tier">
        {TIERS.map((tier) => {
          const config = CARD_TIER_CONFIG[tier];
          const isSelected = selected === tier;
          return (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(tier)}
              className={cn("pc-tier-option", isSelected && "pc-tier-option-active")}
            >
              <div className="pc-tier-option-preview">
                <PhysicalCardPreview tier={tier} cardholderName={cardholderName} size="default" />
              </div>
              <div className="pc-tier-option-body">
                <div className="pc-tier-option-head">
                  <span className="pc-tier-option-name">{config.shortLabel}</span>
                  {isSelected && (
                    <span className="pc-tier-option-badge">
                      <Check size={12} strokeWidth={3} />
                      Selected
                    </span>
                  )}
                </div>
                <p className="pc-tier-option-desc">{config.description}</p>
                <p className="pc-tier-option-days">{config.processingDays} day production</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
