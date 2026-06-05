import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={cn("glass-card p-6", hover && "hover-lift cursor-pointer", className)}>
      {children}
    </div>
  );
}
