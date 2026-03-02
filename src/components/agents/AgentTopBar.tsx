import React from "react";
import { cn } from "../reusable/atoms";

type Props = {
  title: string;
  subtitle?: string;
  roleLabel?: string;
  onNotificationsClick?: () => void;
};

export default function AgentTopBar({
  title,
  subtitle,
  roleLabel = "Agent",
  onNotificationsClick,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="leading-tight">
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          {subtitle ? <p className="text-xs text-zinc-600">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
            {roleLabel}
          </span>

          <button
            type="button"
            className={cn(
              "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium transition",
              "text-zinc-900 hover:bg-zinc-50",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
            )}
            onClick={onNotificationsClick ?? (() => alert("Hook notifications"))}
          >
            Notifications
          </button>
        </div>
      </div>
    </header>
  );
}