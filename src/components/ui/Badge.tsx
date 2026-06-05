import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "blue" | "default";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    gold: "bg-accent-gold/10 text-accent-gold border-accent-gold/30",
    green: "bg-accent-green/10 text-accent-green border-accent-green/30",
    red: "bg-accent-red/10 text-accent-red border-accent-red/30",
    blue: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
    default: "bg-bg-tertiary text-text-secondary border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
