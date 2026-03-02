import type React from "react";

export function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-tawi-primary shadow-soft">
        <div className="absolute -left-3 top-1/2 h-12 w-12 -translate-y-1/2 rotate-12 rounded-full bg-tawi-leaf/70" />
        <div className="absolute left-4 top-4 h-7 w-7 rounded-full bg-tawi-dark/70" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-wide text-tawi-dark">TAWI</div>
        <div className="text-xs text-tawi-charcoal2/80">Agri Verify Platform</div>
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-tawi-primary text-white hover:bg-tawi-dark shadow-soft"
      : variant === "secondary"
      ? "bg-white text-tawi-dark ring-1 ring-tawi-leaf/70 hover:ring-tawi-sage hover:bg-tawi-bg"
      : "bg-transparent text-tawi-dark hover:bg-tawi-leaf/30";

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:shadow-glow",
        styles,
        className
      )}
      type="button"
    >
      {children}
    </button>
  );
}