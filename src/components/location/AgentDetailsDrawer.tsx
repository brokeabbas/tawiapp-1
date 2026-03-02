import React, { useMemo, useState } from "react";
import { cn } from "../reusable/atoms";
import RightDrawer from "./RightDrawer";
import type { AgentActivityEvent, AgentStatus, LocationAgent } from "./types";

type Props = {
  open: boolean;
  agent: LocationAgent | null;
  onClose: () => void;
  onSetStatus: (agentId: string, status: AgentStatus) => void;
};

function statusPill(status: AgentStatus) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "suspended") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function kycPill(kyc: LocationAgent["kycStatus"]) {
  if (kyc === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (kyc === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function severityDot(sev: AgentActivityEvent["severity"]) {
  if (sev === "info") return "bg-indigo-500";
  if (sev === "warn") return "bg-amber-500";
  return "bg-rose-500";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildOsmEmbedUrl(lat: number, lng: number) {
  const delta = 0.01;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
  const marker = `${lat}%2C${lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
}
function buildOsmOpenUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export default function AgentDetailsDrawer({ open, agent, onClose, onSetStatus }: Props) {
  const [tab, setTab] = useState<"Overview" | "Performance" | "Activity">("Overview");

  const panelWidth =
    "w-[92vw] sm:w-[440px] lg:w-[32vw] xl:w-[25vw] min-w-[360px] max-w-[520px]";

  const activity: AgentActivityEvent[] = useMemo(() => {
    if (!agent) return [];
    return [
      { id: "ev-1", title: "Captured farm submission uploaded", meta: "Today • 09:14", severity: "info" },
      { id: "ev-2", title: "1 submission flagged (GPS mismatch)", meta: "Yesterday • 16:42", severity: "warn" },
      { id: "ev-3", title: "Device location stale > 24h", meta: "2 days ago • 10:05", severity: "critical" },
      { id: "ev-4", title: "Route updated by supervisor", meta: "3 days ago • 12:31", severity: "info" },
    ];
  }, [agent]);

  const mapEmbed = useMemo(() => {
    if (!agent?.lastKnownLat || !agent?.lastKnownLng) return null;
    return buildOsmEmbedUrl(agent.lastKnownLat, agent.lastKnownLng);
  }, [agent]);

  const mapOpen = useMemo(() => {
    if (!agent?.lastKnownLat || !agent?.lastKnownLng) return "#";
    return buildOsmOpenUrl(agent.lastKnownLat, agent.lastKnownLng);
  }, [agent]);

  if (!agent) {
    return (
      <RightDrawer
        open={open}
        onClose={onClose}
        title="Agent details"
        subtitle="No selection"
        widthClassName={panelWidth}
      >
        <div className="p-5">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-900">Select an agent to view details.</p>
            <p className="mt-1 text-xs text-zinc-600">Click any row in My Agents.</p>
          </div>
        </div>
      </RightDrawer>
    );
  }

  const canActivate = agent.status !== "active";
  const canSuspend = agent.status === "active";

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={agent.fullName}
      subtitle={`${agent.agentCode} • ${agent.assignedLocationName}`}
      widthClassName={panelWidth}
    >
      {/* pb-24 ensures content never hides under sticky footer */}
      <div className="p-5 pb-24">
        {/* Summary card */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold text-zinc-900">{agent.fullName}</p>

                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", statusPill(agent.status))}>
                  {agent.status}
                </span>

                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", kycPill(agent.kycStatus))}>
                  KYC: {agent.kycStatus}
                </span>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Coverage: {agent.lga}, {agent.state}
                {agent.ward ? ` • ${agent.ward}` : ""} • Last active:{" "}
                <span className="font-medium text-zinc-900">{formatDate(agent.lastActiveIso)}</span>
              </p>
            </div>

            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900">
              {agent.fullName
                .split(" ")
                .slice(0, 2)
                .map((x) => x[0]?.toUpperCase())
                .join("")}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(["Overview", "Performance", "Activity"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium transition",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20",
                  tab === t
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab bodies */}
        <div className="mt-4 grid gap-4">
          {tab === "Overview" ? (
            <>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-zinc-900">Contact & assignment</p>

                <div className="mt-3 grid gap-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Phone</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{agent.phone}</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Email</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{agent.email ?? "—"}</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Assigned location</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{agent.assignedLocationName}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Device: {agent.deviceLabel ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alert("Hook: call/SMS agent flow")}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Contact agent
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Hook: reassign agent flow")}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Reassign
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-zinc-900">Last known location</p>
                <p className="mt-1 text-xs text-zinc-600">
                  This helps verify field presence and investigate suspicious submissions.
                </p>

                {agent.lastKnownLat && agent.lastKnownLng && mapEmbed ? (
                  <>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200">
                      <div className="aspect-[16/10] w-full bg-zinc-50">
                        <iframe title="Agent location map" src={mapEmbed} className="h-full w-full" loading="lazy" />
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs text-zinc-600">Coordinates</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900">
                        {agent.lastKnownLat.toFixed(6)}, {agent.lastKnownLng.toFixed(6)}
                      </p>
                      <a
                        href={mapOpen}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        Open on map →
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-medium text-zinc-900">No location available</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Hook: request device sync or prompt agent to enable location permissions.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {tab === "Performance" ? (
            <>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-zinc-900">Productivity metrics</p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Captured (total)</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">{agent.farmsCapturedTotal}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Captured (this week)</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">{agent.farmsCapturedThisWeek}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Pending verifications</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">{agent.pendingVerifications}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Flagged submissions</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">{agent.flaggedSubmissions}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs font-medium text-zinc-900">Quality signal</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Higher flagged rate may indicate training needs, device issues, or deliberate abuse.
                  </p>

                  {/* Simple quality bar */}
                  {(() => {
                    const denom = Math.max(1, agent.farmsCapturedThisWeek);
                    const flaggedRate = Math.min(1, agent.flaggedSubmissions / denom);
                    const pct = Math.round(flaggedRate * 100);
                    const color =
                      pct <= 10 ? "bg-emerald-500" : pct <= 25 ? "bg-amber-500" : "bg-rose-500";

                    return (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-zinc-600">
                          <span>Flagged rate (week)</span>
                          <span className="font-medium text-zinc-900">{pct}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs text-zinc-600">
                  Tip: Agents with frequent GPS mismatches may need device calibration or retraining on capture steps.
                </p>
              </div>
            </>
          ) : null}

          {tab === "Activity" ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-zinc-900">Recent activity</p>

              <div className="mt-3 grid gap-2">
                {activity.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{e.title}</p>
                        <p className="mt-1 text-xs text-zinc-600">{e.meta}</p>
                      </div>
                      <span className={cn("mt-1 inline-flex h-2.5 w-2.5 rounded-full", severityDot(e.severity))} />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => alert("Hook: full agent activity log")}
                className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View full log
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-600">
            Status controls affect capture permissions and compliance monitoring.
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => alert("Hook: assign tasks to agent")}
              className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Assign
            </button>

            <button
              type="button"
              disabled={!canActivate}
              onClick={() => {
                if (window.confirm("Activate this agent?")) onSetStatus(agent.id, "active");
              }}
              className={cn(
                "rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white",
                "hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              Activate
            </button>

            <button
              type="button"
              disabled={!canSuspend}
              onClick={() => {
                if (window.confirm("Suspend this agent? They will not be able to capture farms.")) {
                  onSetStatus(agent.id, "suspended");
                }
              }}
              className={cn(
                "rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700",
                "hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              Suspend
            </button>
          </div>
        </div>
      </div>
    </RightDrawer>
  );
}