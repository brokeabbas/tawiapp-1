import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../reusable/atoms";

type Props = {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string; // optional override
};

export default function RightDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClassName,
}: Props) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    // lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus close button
    window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const panelWidth =
    widthClassName ??
    // quarter-ish on desktop, sensible on mobile
    "w-[92vw] sm:w-[440px] lg:w-[32vw] xl:w-[25vw] min-w-[360px] max-w-[520px]";

  const content = (
    <div
      className={cn(
        "fixed inset-0 z-40",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-label="Close drawer overlay"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute inset-y-0 right-0 z-50 flex h-full flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl",
          "transition-transform duration-300 ease-out will-change-transform",
          open ? "translate-x-0" : "translate-x-full",
          panelWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="leading-tight">
              {title ? (
                <p className="text-sm font-semibold text-zinc-900">{title}</p>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 text-xs text-zinc-600">{subtitle}</p>
              ) : null}
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className={cn(
                "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 transition",
                "hover:bg-zinc-50",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
              )}
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Body (only this scrolls) */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </aside>
    </div>
  );

  return createPortal(content, document.body);
}