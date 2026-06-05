import Link from "next/link";
import { Zap } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient-bg shadow-brand">
        <Zap size={18} className="text-white" fill="white" />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-white">
          Platinum<span className="text-accent-brand">Crest</span>
        </span>
      )}
    </Link>
  );
}
