// tawifarms\src\pages\LocationCapturedFarmsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import LocationLayout from "../components/location/LocationLayout";
import { cn } from "../components/reusable/atoms";
import FarmDetailsDrawer from "../components/location/FarmDetailsDrawer";
import type { CapturedFarm, VerificationState } from "../components/location/types";

function pill(verification: VerificationState) {
  if (verification === "verified")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (verification === "pending")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
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

function exportCsv(rows: CapturedFarm[]) {
  const headers = [
    "Farm ID",
    "Farmer Name",
    "Phone",
    "Crop",
    "Size (ha)",
    "Community",
    "Ward",
    "LGA",
    "State",
    "Captured By",
    "Captured At",
    "Verification",
    "Issues",
    "Latitude",
    "Longitude",
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.farmerName,
        r.farmerPhone,
        r.crop,
        r.sizeHa.toFixed(2),
        r.community,
        r.ward,
        r.lga,
        r.state,
        r.capturedBy,
        r.capturedAtIso,
        r.verification,
        r.issues,
        r.lat.toFixed(6),
        r.lng.toFixed(6),
      ]
        .map(escape)
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `captured-farms-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LocationCapturedFarmsPage() {
  const farms: CapturedFarm[] = useMemo(() => {
    const base: CapturedFarm[] = [
      {
        id: "FARM-OY-000121",
        farmerName: "Adebisi Adeyemi",
        farmerPhone: "+234 803 111 2200",
        crop: "Maize",
        sizeHa: 1.8,
        community: "Ring Road",
        ward: "Ward 05",
        lga: "Ibadan North",
        state: "Oyo",
        capturedBy: "Agent • Oluwatobi",
        capturedAtIso: "2026-02-28T09:12:00.000Z",
        verification: "verified",
        issues: 0,
        lat: 7.378215,
        lng: 3.947941,
      },
      {
        id: "FARM-OY-000122",
        farmerName: "Kehinde Akinyemi",
        farmerPhone: "+234 802 900 1844",
        crop: "Cassava",
        sizeHa: 2.4,
        community: "Mokola",
        ward: "Ward 07",
        lga: "Ibadan North",
        state: "Oyo",
        capturedBy: "Agent • Tola",
        capturedAtIso: "2026-02-28T10:41:00.000Z",
        verification: "pending",
        issues: 1,
        lat: 7.392184,
        lng: 3.921511,
      },
      {
        id: "FARM-OY-000123",
        farmerName: "Rashidat Bello",
        farmerPhone: "+234 809 002 7744",
        crop: "Rice",
        sizeHa: 0.9,
        community: "Apata",
        ward: "Ward 11",
        lga: "Ibadan South-West",
        state: "Oyo",
        capturedBy: "Agent • Daniel",
        capturedAtIso: "2026-02-27T15:05:00.000Z",
        verification: "flagged",
        issues: 2,
        lat: 7.357114,
        lng: 3.867908,
      },
      {
        id: "FARM-OY-000124",
        farmerName: "Sunday Ogunleye",
        farmerPhone: "+234 701 450 3301",
        crop: "Cocoa",
        sizeHa: 3.6,
        community: "Akinyele",
        ward: "Ward 02",
        lga: "Akinyele",
        state: "Oyo",
        capturedBy: "Agent • Zainab",
        capturedAtIso: "2026-02-26T08:22:00.000Z",
        verification: "verified",
        issues: 0,
        lat: 7.51287,
        lng: 3.90422,
      },
      {
        id: "FARM-OY-000125",
        farmerName: "Bamidele Ojo",
        farmerPhone: "+234 805 661 9002",
        crop: "Yam",
        sizeHa: 1.2,
        community: "Challenge",
        ward: "Ward 09",
        lga: "Ibadan South-West",
        state: "Oyo",
        capturedBy: "Agent • Tola",
        capturedAtIso: "2026-02-25T12:10:00.000Z",
        verification: "pending",
        issues: 0,
        lat: 7.34811,
        lng: 3.879022,
      },
    ];

    const crops = ["Maize", "Cassava", "Rice", "Yam", "Cocoa", "Sorghum", "Vegetables"];
    const agents = [
      "Agent • Oluwatobi",
      "Agent • Tola",
      "Agent • Daniel",
      "Agent • Zainab",
      "Agent • Chisom",
    ];
    const wards = ["Ward 01", "Ward 02", "Ward 05", "Ward 07", "Ward 09", "Ward 11"];
    const communities = ["Ring Road", "Mokola", "Apata", "Challenge", "Dugbe", "Bodija", "Ojoo", "Ologuneru"];

    const extra: CapturedFarm[] = Array.from({ length: 26 }).map((_, i) => {
      const n = 126 + i;
      const capturedBy = agents[i % agents.length];
      const crop = crops[i % crops.length];
      const ward = wards[i % wards.length];
      const community = communities[i % communities.length];
      const verification: VerificationState =
        i % 7 === 0 ? "flagged" : i % 3 === 0 ? "pending" : "verified";
      const issues = verification === "flagged" ? (i % 3) + 1 : verification === "pending" ? i % 2 : 0;

      const dt = new Date(Date.UTC(2026, 1, 15 + (i % 14), 8 + (i % 9), (i * 7) % 60, 0));

      return {
        id: `FARM-OY-${String(n).padStart(6, "0")}`,
        farmerName: `Farmer ${n} ${i % 2 === 0 ? "Ade" : "Bello"}`,
        farmerPhone: `+234 80${(i % 9) + 1} ${String(1000000 + i * 932).slice(0, 7)}`,
        crop,
        sizeHa: Number((0.6 + (i % 9) * 0.35).toFixed(2)),
        community,
        ward,
        lga: i % 2 === 0 ? "Ibadan North" : "Ibadan South-West",
        state: "Oyo",
        capturedBy,
        capturedAtIso: dt.toISOString(),
        verification,
        issues,
        lat: 7.33 + (i % 10) * 0.015 + (i % 3) * 0.002,
        lng: 3.86 + (i % 11) * 0.012 + (i % 4) * 0.001,
      };
    });

    return [...base, ...extra].sort((a, b) => (a.capturedAtIso < b.capturedAtIso ? 1 : -1));
  }, []);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | VerificationState>("all");
  const [agent, setAgent] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Drawer state
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, VerificationState>>({});

  const effectiveStatus = (f: CapturedFarm) => statusOverrides[f.id] ?? f.verification;

  const selectedFarm = useMemo(() => {
    if (!selectedFarmId) return null;
    const base = farms.find((x) => x.id === selectedFarmId) ?? null;
    if (!base) return null;
    return { ...base, verification: effectiveStatus(base) };
  }, [selectedFarmId, farms, statusOverrides]);

  const agents = useMemo(() => {
    const set = new Set(farms.map((f) => f.capturedBy));
    return ["all", ...Array.from(set).sort()];
  }, [farms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return farms.filter((f) => {
      const matchesQuery =
        !q ||
        f.id.toLowerCase().includes(q) ||
        f.farmerName.toLowerCase().includes(q) ||
        f.farmerPhone.toLowerCase().includes(q) ||
        f.community.toLowerCase().includes(q) ||
        f.lga.toLowerCase().includes(q);

      const v = effectiveStatus(f);
      const matchesStatus = status === "all" ? true : v === status;
      const matchesAgent = agent === "all" ? true : f.capturedBy === agent;

      return matchesQuery && matchesStatus && matchesAgent;
    });
  }, [farms, query, status, agent, statusOverrides]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  const kpis = useMemo(() => {
    const total = farms.length;
    const verified = farms.filter((f) => effectiveStatus(f) === "verified").length;
    const pending = farms.filter((f) => effectiveStatus(f) === "pending").length;
    const flagged = farms.filter((f) => effectiveStatus(f) === "flagged").length;

    const todayKey = new Date().toISOString().slice(0, 10);
    const capturedToday = farms.filter((f) => f.capturedAtIso.slice(0, 10) === todayKey).length;

    return { total, verified, pending, flagged, capturedToday };
  }, [farms, statusOverrides]);

  // keep pagination stable when filters change
  useEffect(() => {
    setPage(1);
  }, [query, status, agent]);

  return (
    <LocationLayout
      title="Captured Farms"
      subtitle="All farms captured by field agents — verification status, evidence quality, and issue triage."
    >
      <main className="w-full px-4 pb-10 sm:px-6 lg:px-10">
        <div className="mt-6 grid gap-4">
          {/* Header actions */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">Captured farms registry</h1>
                <p className="mt-1 text-sm text-zinc-600">
                  Search captured records, track verification state, and escalate flagged submissions.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    exportCsv(
                      filtered.map((f) => ({
                        ...f,
                        verification: effectiveStatus(f),
                      }))
                    )
                  }
                  className={cn(
                    "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition",
                    "hover:bg-zinc-50",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => alert("Hook: bulk review flow")}
                  className={cn(
                    "rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition",
                    "hover:bg-indigo-700",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                  )}
                >
                  Bulk review
                </button>
                <button
                  type="button"
                  onClick={() => alert("Hook: add farm / manual capture")}
                  className={cn(
                    "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition",
                    "hover:bg-emerald-700",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                  )}
                >
                  Add farm
                </button>
              </div>
            </div>

            {/* KPI */}
            <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Total farms", value: kpis.total },
                { label: "Verified", value: kpis.verified },
                { label: "Pending", value: kpis.pending },
                { label: "Flagged", value: kpis.flagged },
                { label: "Captured today", value: kpis.capturedToday },
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
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-zinc-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 21l-4.3-4.3" />
                    <path d="M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Farm ID, farmer name, phone, community, LGA…"
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs font-medium text-zinc-700">Verification</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={cn(
                    "mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs font-medium text-zinc-700">Captured by</label>
                <select
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className={cn(
                    "mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  {agents.map((a) => (
                    <option key={a} value={a}>
                      {a === "all" ? "All agents" : a}
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
                  setAgent("all");
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
                  <div className="col-span-2">Farm ID</div>
                  <div className="col-span-2">Farmer</div>
                  <div className="col-span-2">Community / LGA</div>
                  <div className="col-span-1 text-right">Size (ha)</div>
                  <div className="col-span-1">Crop</div>
                  <div className="col-span-2">Captured by</div>
                  <div className="col-span-1">Verification</div>
                  <div className="col-span-1 text-right">Issues</div>
                </div>

                <div className="divide-y divide-zinc-200">
                  {paged.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-zinc-600">
                      No farms match your filters.
                    </div>
                  ) : (
                    paged.map((f) => {
                      const v = effectiveStatus(f);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelectedFarmId(f.id);
                            setDrawerOpen(true);
                          }}
                          className={cn(
                            "w-full text-left transition hover:bg-zinc-50",
                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/15"
                          )}
                        >
                          <div className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                            <div className="col-span-2">
                              <p className="text-sm font-semibold text-zinc-900">{f.id}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{formatDate(f.capturedAtIso)}</p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-sm font-medium text-zinc-900">{f.farmerName}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">{f.farmerPhone}</p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-sm text-zinc-900">{f.community}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">
                                {f.lga}, {f.state}
                              </p>
                            </div>

                            <div className="col-span-1 text-right">
                              <p className="text-sm font-medium text-zinc-900">{f.sizeHa.toFixed(2)}</p>
                            </div>

                            <div className="col-span-1">
                              <p className="text-sm text-zinc-900">{f.crop}</p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-sm text-zinc-900">{f.capturedBy}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {f.lat.toFixed(4)}, {f.lng.toFixed(4)}
                              </p>
                            </div>

                            <div className="col-span-1">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                  pill(v)
                                )}
                              >
                                {v}
                              </span>
                            </div>

                            <div className="col-span-1 flex justify-end">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                                  f.issues === 0
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border border-amber-200 bg-amber-50 text-amber-700"
                                )}
                              >
                                {f.issues}
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
              Verification standard: “Flagged” farms typically indicate missing evidence (photo/GPS), suspicious coordinates,
              duplicate farmer identifiers, or admin-boundary mismatch. Use Bulk review for quicker triage.
            </p>
          </div>
        </div>
      </main>

      {/* Drawer */}
      <FarmDetailsDrawer
        open={drawerOpen}
        farm={selectedFarm}
        onClose={() => setDrawerOpen(false)}
        onApprove={(farmId) => {
          setStatusOverrides((prev) => ({ ...prev, [farmId]: "verified" }));
        }}
        onReject={(farmId) => {
          setStatusOverrides((prev) => ({ ...prev, [farmId]: "flagged" }));
        }}
      />
    </LocationLayout>
  );
}