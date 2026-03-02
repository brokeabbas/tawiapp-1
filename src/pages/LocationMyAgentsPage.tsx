import React, { useEffect, useMemo, useState } from "react";
import LocationLayout from "../components/location/LocationLayout";
import { cn } from "../components/reusable/atoms";
import AgentDetailsDrawer from "../components/location/AgentDetailsDrawer";
import type { AgentStatus, LocationAgent } from "../components/location/types";

function statusPill(status: AgentStatus) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "suspended") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
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

export default function LocationMyAgentsPage() {
  const agentsData: LocationAgent[] = useMemo(() => {
    const now = new Date("2026-03-01T09:30:00.000Z").getTime();

    const base: LocationAgent[] = [
      {
        id: "AG-001",
        fullName: "Oluwatobi Adebayo",
        phone: "+234 803 222 1100",
        email: "tobi@tawi.example",
        status: "active",
        state: "Oyo",
        lga: "Ibadan North",
        ward: "Ward 05",
        assignedLocationName: "Tawi Hub — Ibadan",
        agentCode: "TAWI-AG-OY-001",
        farmsCapturedTotal: 148,
        farmsCapturedThisWeek: 12,
        pendingVerifications: 4,
        flaggedSubmissions: 1,
        lastActiveIso: new Date(now - 35 * 60_000).toISOString(),
        lastKnownLat: 7.3778,
        lastKnownLng: 3.9469,
        deviceLabel: "Android • Infinix Hot",
        kycStatus: "verified",
      },
      {
        id: "AG-002",
        fullName: "Tola Ogunbiyi",
        phone: "+234 802 900 1844",
        email: "tola@tawi.example",
        status: "active",
        state: "Oyo",
        lga: "Ibadan North",
        ward: "Ward 07",
        assignedLocationName: "Tawi Hub — Ibadan",
        agentCode: "TAWI-AG-OY-002",
        farmsCapturedTotal: 121,
        farmsCapturedThisWeek: 9,
        pendingVerifications: 8,
        flaggedSubmissions: 2,
        lastActiveIso: new Date(now - 2 * 60_60_000).toISOString(),
        lastKnownLat: 7.3922,
        lastKnownLng: 3.9215,
        deviceLabel: "Android • Samsung A12",
        kycStatus: "pending",
      },
      {
        id: "AG-003",
        fullName: "Zainab Abdulsalam",
        phone: "+234 701 450 3301",
        email: "zainab@tawi.example",
        status: "active",
        state: "Oyo",
        lga: "Akinyele",
        ward: "Ward 02",
        assignedLocationName: "Tawi Hub — Ibadan",
        agentCode: "TAWI-AG-OY-003",
        farmsCapturedTotal: 203,
        farmsCapturedThisWeek: 15,
        pendingVerifications: 3,
        flaggedSubmissions: 0,
        lastActiveIso: new Date(now - 18 * 60_000).toISOString(),
        lastKnownLat: 7.5130,
        lastKnownLng: 3.9040,
        deviceLabel: "Android • Tecno Spark",
        kycStatus: "verified",
      },
      {
        id: "AG-004",
        fullName: "Daniel Okafor",
        phone: "+234 809 002 7744",
        status: "suspended",
        state: "Oyo",
        lga: "Ibadan South-West",
        ward: "Ward 11",
        assignedLocationName: "Tawi Hub — Ibadan",
        agentCode: "TAWI-AG-OY-004",
        farmsCapturedTotal: 67,
        farmsCapturedThisWeek: 2,
        pendingVerifications: 6,
        flaggedSubmissions: 4,
        lastActiveIso: new Date(now - 28 * 60_60_000).toISOString(),
        lastKnownLat: 7.3571,
        lastKnownLng: 3.8679,
        deviceLabel: "Android • Redmi 9",
        kycStatus: "needs-review",
      },
      {
        id: "AG-005",
        fullName: "Chisom Nwankwo",
        phone: "+234 805 661 9002",
        status: "inactive",
        state: "Oyo",
        lga: "Ibadan North",
        ward: "Ward 01",
        assignedLocationName: "Tawi Hub — Ibadan",
        agentCode: "TAWI-AG-OY-005",
        farmsCapturedTotal: 19,
        farmsCapturedThisWeek: 0,
        pendingVerifications: 0,
        flaggedSubmissions: 0,
        lastActiveIso: new Date(now - 12 * 24 * 60_60_000).toISOString(),
        deviceLabel: "—",
        kycStatus: "pending",
      },
    ];

    // Add a few more realistic rows
    const names = [
      "Adeola Sanni",
      "Mariam Yusuf",
      "Ibrahim Bello",
      "Kehinde Akinyemi",
      "Bamidele Ojo",
      "Rashidat Bello",
    ];
    const lgas = ["Ibadan North", "Ibadan South-West", "Akinyele"];
    const wards = ["Ward 01", "Ward 02", "Ward 05", "Ward 07", "Ward 09", "Ward 11"];

    const extra: LocationAgent[] = Array.from({ length: 18 }).map((_, i) => {
      const status: AgentStatus = i % 11 === 0 ? "suspended" : i % 7 === 0 ? "inactive" : "active";
      const kyc: LocationAgent["kycStatus"] = i % 9 === 0 ? "needs-review" : i % 4 === 0 ? "pending" : "verified";
      const farmsWeek = status === "active" ? (i % 9) + 1 : 0;
      const flagged = status === "active" ? (i % 5 === 0 ? 2 : i % 8 === 0 ? 1 : 0) : i % 2;

      return {
        id: `AG-${String(6 + i).padStart(3, "0")}`,
        fullName: names[i % names.length],
        phone: `+234 80${(i % 9) + 1} ${String(1000000 + i * 731).slice(0, 7)}`,
        status,
        state: "Oyo",
        lga: lgas[i % lgas.length],
        ward: wards[i % wards.length],
        assignedLocationName: "Tawi Hub — Ibadan",
        agentCode: `TAWI-AG-OY-${String(6 + i).padStart(3, "0")}`,
        farmsCapturedTotal: 30 + i * 7,
        farmsCapturedThisWeek: farmsWeek,
        pendingVerifications: status === "active" ? (i % 6) : (i % 2),
        flaggedSubmissions: flagged,
        lastActiveIso: new Date(now - (i % 72) * 60_60_000).toISOString(),
        lastKnownLat: status === "active" ? 7.33 + (i % 10) * 0.015 : undefined,
        lastKnownLng: status === "active" ? 3.86 + (i % 11) * 0.012 : undefined,
        deviceLabel: status === "active" ? "Android • Field device" : "—",
        kycStatus: kyc,
      };
    });

    return [...base, ...extra].sort((a, b) => (a.lastActiveIso < b.lastActiveIso ? 1 : -1));
  }, []);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AgentStatus>("all");
  const [lga, setLga] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Drawer state + overrides
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AgentStatus>>({});

  const effectiveStatus = (a: LocationAgent) => statusOverrides[a.id] ?? a.status;

  const lgas = useMemo(() => {
    const set = new Set(agentsData.map((a) => a.lga));
    return ["all", ...Array.from(set).sort()];
  }, [agentsData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agentsData.filter((a) => {
      const matchesQuery =
        !q ||
        a.fullName.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        a.agentCode.toLowerCase().includes(q);

      const matchesStatus = status === "all" ? true : effectiveStatus(a) === status;
      const matchesLga = lga === "all" ? true : a.lga === lga;

      return matchesQuery && matchesStatus && matchesLga;
    });
  }, [agentsData, query, status, lga, statusOverrides]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  const kpis = useMemo(() => {
    const total = agentsData.length;
    const active = agentsData.filter((a) => effectiveStatus(a) === "active").length;
    const suspended = agentsData.filter((a) => effectiveStatus(a) === "suspended").length;
    const inactive = agentsData.filter((a) => effectiveStatus(a) === "inactive").length;

    const weekCaptured = agentsData.reduce((sum, a) => sum + (a.farmsCapturedThisWeek ?? 0), 0);
    const pending = agentsData.reduce((sum, a) => sum + (a.pendingVerifications ?? 0), 0);

    return { total, active, suspended, inactive, weekCaptured, pending };
  }, [agentsData, statusOverrides]);

  const selectedAgent = useMemo(() => {
    if (!selectedId) return null;
    const base = agentsData.find((x) => x.id === selectedId) ?? null;
    if (!base) return null;
    return { ...base, status: effectiveStatus(base) };
  }, [selectedId, agentsData, statusOverrides]);

  useEffect(() => setPage(1), [query, status, lga]);

  return (
    <LocationLayout
      title="My Agents"
      subtitle="Monitor agent performance, verification quality, and field readiness."
    >
      <main className="w-full px-4 pb-10 sm:px-6 lg:px-10">
        <div className="mt-6 grid gap-4">
          {/* Header */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">Agents registry</h1>
                <p className="mt-1 text-sm text-zinc-600">
                  Search agents, inspect details, and take action (activate/suspend) when necessary.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => alert("Hook: invite / add agent flow")}
                  className={cn(
                    "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition",
                    "hover:bg-emerald-700",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                  )}
                >
                  Add agent
                </button>
                <button
                  type="button"
                  onClick={() => alert("Hook: export agents")}
                  className={cn(
                    "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition",
                    "hover:bg-zinc-50",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  Export
                </button>
              </div>
            </div>

            {/* KPI */}
            <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {[
                { label: "Total agents", value: kpis.total },
                { label: "Active", value: kpis.active },
                { label: "Suspended", value: kpis.suspended },
                { label: "Inactive", value: kpis.inactive },
                { label: "Captured (week)", value: kpis.weekCaptured },
                { label: "Pending verifications", value: kpis.pending },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-600">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">{s.value}</p>
                </div>
              ))}
            </section>
          </div>

          {/* Filters */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <label className="text-xs font-medium text-zinc-700">Search</label>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 21l-4.3-4.3" />
                    <path d="M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, phone, agent code…"
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs font-medium text-zinc-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={cn(
                    "mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs font-medium text-zinc-700">LGA</label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className={cn(
                    "mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  {lgas.map((x) => (
                    <option key={x} value={x}>
                      {x === "all" ? "All LGAs" : x}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-zinc-600">
                Showing <span className="font-medium text-zinc-900">{filtered.length}</span> result(s)
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setLga("all");
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Clear filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-soft">
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-600">
                  <div className="col-span-3">Agent</div>
                  <div className="col-span-2">Coverage</div>
                  <div className="col-span-2">Captured</div>
                  <div className="col-span-2">Verification</div>
                  <div className="col-span-2">Last active</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>

                <div className="divide-y divide-zinc-200">
                  {paged.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-zinc-600">
                      No agents match your filters.
                    </div>
                  ) : (
                    paged.map((a) => {
                      const s = effectiveStatus(a);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(a.id);
                            setDrawerOpen(true);
                          }}
                          className={cn(
                            "w-full text-left transition hover:bg-zinc-50",
                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/15"
                          )}
                        >
                          <div className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                            <div className="col-span-3">
                              <p className="text-sm font-semibold text-zinc-900">{a.fullName}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">{a.agentCode} • {a.phone}</p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-sm text-zinc-900">{a.lga}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">{a.state}{a.ward ? ` • ${a.ward}` : ""}</p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-sm font-medium text-zinc-900">{a.farmsCapturedTotal}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">Week: {a.farmsCapturedThisWeek}</p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-sm text-zinc-900">Pending: {a.pendingVerifications}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">Flagged: {a.flaggedSubmissions}</p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-sm text-zinc-900">{formatDate(a.lastActiveIso)}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">{a.assignedLocationName}</p>
                            </div>

                            <div className="col-span-1 flex justify-end">
                              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", statusPill(s))}>
                                {s}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-600">
                Page <span className="font-medium text-zinc-900">{safePage}</span> of{" "}
                <span className="font-medium text-zinc-900">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className={cn(
                    "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900",
                    "hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className={cn(
                    "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900",
                    "hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
            <p className="text-xs text-zinc-600">
              Standard: Suspend agents with repeated evidence quality failures or suspected fraud. Prefer retraining for GPS/photo issues first.
            </p>
          </div>
        </div>
      </main>

      {/* Drawer */}
      <AgentDetailsDrawer
        open={drawerOpen}
        agent={selectedAgent}
        onClose={() => setDrawerOpen(false)}
        onSetStatus={(agentId, next) => {
          setStatusOverrides((prev) => ({ ...prev, [agentId]: next }));
        }}
      />
    </LocationLayout>
  );
}