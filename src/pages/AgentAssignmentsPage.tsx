import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../components/reusable/atoms";
import { AgentLayout } from "../components/agents";

type AssignmentStatus = "assigned" | "in_progress" | "captured" | "overdue";

type FarmAssignment = {
  id: string;
  farmName: string;
  locationCode: string;
  address: string;
  lga?: string;
  priority: "low" | "medium" | "high";
  status: AssignmentStatus;
  distanceKm: number;
  due: string;
  notes?: string;
};

function statusPill(status: AssignmentStatus) {
  switch (status) {
    case "assigned":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    case "in_progress":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "captured":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "overdue":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function priorityPill(priority: FarmAssignment["priority"]) {
  switch (priority) {
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "medium":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    case "low":
      return "border-zinc-200 bg-white text-zinc-600";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

export default function AgentAssignmentsPage() {
  const navigate = useNavigate();

  const assignments = useMemo<FarmAssignment[]>(
    () => [
      {
        id: "asg_001",
        farmName: "Green Valley Farm",
        locationCode: "GVF-LEKKI-012",
        address: "Km 12, Lekki-Epe Expressway, Lagos",
        lga: "Ibeju-Lekki",
        priority: "high",
        status: "assigned",
        distanceKm: 6.4,
        due: "Today, 4:00 PM",
        notes: "Capture at the main gate; avoid indoor readings.",
      },
      {
        id: "asg_002",
        farmName: "Sunrise Produce Hub",
        locationCode: "SPH-IBEJU-104",
        address: "Ibeju-Lekki, Lagos",
        lga: "Ibeju-Lekki",
        priority: "medium",
        status: "in_progress",
        distanceKm: 12.9,
        due: "Today, 6:30 PM",
        notes: "Try for ≤15m accuracy, hold steady 20–30 seconds.",
      },
      {
        id: "asg_003",
        farmName: "Tawi Cold Room (Ajah)",
        locationCode: "TCR-AJAH-007",
        address: "Ajah, Lagos",
        lga: "Eti-Osa",
        priority: "medium",
        status: "assigned",
        distanceKm: 18.2,
        due: "Tomorrow, 11:00 AM",
        notes: "Best signal outside near loading bay.",
      },
      {
        id: "asg_004",
        farmName: "Harvest Point Farm",
        locationCode: "HPF-SANGO-033",
        address: "Sangotedo, Lagos",
        lga: "Eti-Osa",
        priority: "low",
        status: "captured",
        distanceKm: 9.1,
        due: "Completed",
        notes: "Saved successfully — linked.",
      },
      {
        id: "asg_005",
        farmName: "Riverbend Growers",
        locationCode: "RBG-EPE-221",
        address: "Epe, Lagos",
        lga: "Epe",
        priority: "high",
        status: "overdue",
        distanceKm: 41.5,
        due: "Yesterday, 5:00 PM",
        notes: "Overdue: priority location for onboarding.",
      },
    ],
    []
  );

  const stats = useMemo(() => {
    const total = assignments.length;
    const assigned = assignments.filter((a) => a.status === "assigned").length;
    const inProgress = assignments.filter((a) => a.status === "in_progress").length;
    const captured = assignments.filter((a) => a.status === "captured").length;
    const overdue = assignments.filter((a) => a.status === "overdue").length;
    return { total, assigned, inProgress, captured, overdue };
  }, [assignments]);

  const goCapture = (a: FarmAssignment) => {
    const q = new URLSearchParams({
      assignment: a.id,
      code: a.locationCode,
      farm: a.farmName,
    });
    navigate(`/agent?${q.toString()}`);
  };

  const openMaps = (a: FarmAssignment) => {
    const q = encodeURIComponent(`${a.farmName} ${a.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener,noreferrer");
  };

  return (
    <AgentLayout title="Assignments" subtitle="Farms allocated to you for geo-capturing and linking.">
      <main className="w-full px-4 py-8 sm:px-6">
        {/* Summary */}
        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-zinc-600">Total</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-zinc-600">Assigned</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.assigned}</p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-zinc-600">In progress</p>
            <p className="mt-2 text-2xl font-semibold text-indigo-700">{stats.inProgress}</p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-zinc-600">Captured</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{stats.captured}</p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-zinc-600">Overdue</p>
            <p className="mt-2 text-2xl font-semibold text-rose-700">{stats.overdue}</p>
          </div>
        </section>

        {/* List */}
        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Assigned farms</p>
              <p className="mt-1 text-xs text-zinc-600">
                Tap an assignment to start capturing or view details.
              </p>
            </div>

            <button
              type="button"
              className={cn(
                "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium transition",
                "text-zinc-900 hover:bg-zinc-100",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
              )}
              onClick={() => alert("Hook this to API refresh")}
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition",
                  "hover:bg-zinc-100"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{a.farmName}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {a.address}
                      {a.lga ? ` · ${a.lga}` : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                          statusPill(a.status)
                        )}
                      >
                        {a.status === "in_progress"
                          ? "In progress"
                          : a.status[0].toUpperCase() + a.status.slice(1)}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                          priorityPill(a.priority)
                        )}
                      >
                        Priority: {a.priority}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                        ~{a.distanceKm.toFixed(1)}km away
                      </span>

                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                        Due: {a.due}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                        Code: {a.locationCode}
                      </span>
                    </div>

                    {a.notes ? (
                      <p className="mt-3 text-xs leading-5 text-zinc-600">
                        <span className="font-semibold text-zinc-800">Note:</span> {a.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className={cn(
                        "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium transition",
                        "text-zinc-900 hover:bg-zinc-100",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                      )}
                      onClick={() => openMaps(a)}
                    >
                      Open maps
                    </button>

                    <button
                      type="button"
                      className={cn(
                        "rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition",
                        "hover:bg-emerald-500",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                      )}
                      onClick={() => goCapture(a)}
                    >
                      Capture now
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(
                      "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold transition",
                      "text-zinc-800 hover:bg-zinc-100",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                    )}
                    onClick={() => alert(`Hook details view for: ${a.id}`)}
                  >
                    View details
                  </button>

                  <button
                    type="button"
                    className={cn(
                      "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold transition",
                      "text-zinc-800 hover:bg-zinc-100",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                    )}
                    onClick={() => alert(`Hook mark-as-in-progress for: ${a.id}`)}
                  >
                    Mark in-progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              "text-zinc-700 hover:text-zinc-900",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
            )}
            onClick={() => navigate("/agent")}
          >
            Back to Capture
          </button>
        </div>
      </main>
    </AgentLayout>
  );
}