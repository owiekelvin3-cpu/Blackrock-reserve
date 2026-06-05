"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "gold", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      gold: "btn-gold",
      ghost: "btn-ghost",
      outline: "btn-outline",
      danger: "bg-accent-red/10 text-accent-red border border-accent-red/30 hover:bg-accent-red/20",
    };

    const sizes = {
      sm: "px-5 py-2 text-sm rounded-full",
      md: "px-6 py-3 text-sm rounded-full",
      lg: "px-8 py-4 text-base rounded-full",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
