import React, { useMemo } from "react";
import LocationLayout from "../components/location/LocationLayout";
import { cn } from "../components/reusable/atoms";

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  status: "ok" | "warn" | "issue";
};

type LocationItem = {
  id: string;
  name: string;
  state: string;
  agents: number;
  visitsToday: number;
  issues: number;
};

export default function LocationDashboardPage() {
  const stats = useMemo(
    () => [
      { label: "Locations", value: "12", hint: "Active sites under you" },
      { label: "Agents", value: "38", hint: "Field staff assigned" },
      { label: "Visits today", value: "74", hint: "Logged check-ins today" },
      { label: "Open issues", value: "5", hint: "Needs attention" },
    ],
    []
  );

  const locations: LocationItem[] = useMemo(
    () => [
      { id: "loc-01", name: "Tawi Hub — Ilorin", state: "Kwara", agents: 6, visitsToday: 11, issues: 1 },
      { id: "loc-02", name: "Tawi Hub — Ibadan", state: "Oyo", agents: 9, visitsToday: 18, issues: 0 },
      { id: "loc-03", name: "Tawi Hub — Abeokuta", state: "Ogun", agents: 5, visitsToday: 8, issues: 2 },
      { id: "loc-04", name: "Tawi Hub — Akure", state: "Ondo", agents: 4, visitsToday: 6, issues: 0 },
    ],
    []
  );

  const activity: ActivityItem[] = useMemo(
    () => [
      { id: "a-01", title: "Daily summary generated", meta: "Today • 08:12", status: "ok" },
      { id: "a-02", title: "Ilorin: 1 visit flagged (missing photo)", meta: "Today • 09:03", status: "warn" },
      { id: "a-03", title: "Abeokuta: 2 open issues (delayed check-in)", meta: "Today • 10:41", status: "issue" },
      { id: "a-04", title: "Ibadan: agent route updated", meta: "Today • 11:15", status: "ok" },
    ],
    []
  );

  return (
    <LocationLayout
      title="Location Dashboard"
      subtitle="Review activity, track issues, and keep performance consistent across sites."
    >
<main className="w-full px-4 pb-10 sm:px-6 lg:px-10">
<div className="mt-6 w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Overview
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Monitor performance across sites and respond quickly to issues.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert("Hook this to assign work flow")}
                className={cn(
                  "rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition",
                  "hover:bg-emerald-600",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                )}
              >
                Assign work
              </button>
              <button
                type="button"
                onClick={() => alert("Hook this to issues page")}
                className={cn(
                  "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition",
                  "hover:bg-zinc-50",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                )}
              >
                View issues
              </button>
            </div>
          </div>

          {/* Stats */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs text-zinc-600">{s.label}</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">{s.value}</p>
                <p className="mt-2 text-xs text-zinc-600">{s.hint}</p>
              </div>
            ))}
          </section>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {/* Locations */}
            <section className="lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">Locations</h2>
                <button
                  type="button"
                  onClick={() => alert("Hook this to full locations page")}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                >
                  See all
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="bg-zinc-50">
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-zinc-600">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2 text-right">Agents</div>
                    <div className="col-span-2 text-right">Visits</div>
                    <div className="col-span-2 text-right">Issues</div>
                  </div>
                </div>

                <div className="divide-y divide-zinc-200">
                  {locations.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => alert(`Open ${l.name} details page`)}
                      className={cn(
                        "w-full text-left transition hover:bg-zinc-50",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/15"
                      )}
                    >
                      <div className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                        <div className="col-span-6">
                          <p className="text-sm font-medium text-zinc-900">{l.name}</p>
                          <p className="mt-0.5 text-xs text-zinc-600">{l.state}</p>
                        </div>

                        <div className="col-span-2 text-right text-sm text-zinc-700">
                          {l.agents}
                        </div>
                        <div className="col-span-2 text-right text-sm text-zinc-700">
                          {l.visitsToday}
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                              l.issues === 0
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-amber-200 bg-amber-50 text-amber-700"
                            )}
                          >
                            {l.issues}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Activity */}
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">Recent activity</h2>
                <button
                  type="button"
                  onClick={() => alert("Hook this to activity log")}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                >
                  View log
                </button>
              </div>

              <div className="mt-3 grid gap-2">
                {activity.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-900">{a.title}</p>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
                          a.status === "ok" && "bg-emerald-500",
                          a.status === "warn" && "bg-amber-500",
                          a.status === "issue" && "bg-rose-500"
                        )}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-600">{a.meta}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs text-zinc-600">
                  Tip: Review yesterday’s activity before assigning today’s work.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </LocationLayout>
  );
}