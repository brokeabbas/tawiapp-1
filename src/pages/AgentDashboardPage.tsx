import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, cn } from "../components/reusable/atoms";
import { AgentLayout } from "../components/agents";

type VisitTask = {
  id: string;
  location: string;
  address: string;
  status: "pending" | "in_progress" | "done";
  eta: string;
};

export default function AgentDashboardPage() {
  const navigate = useNavigate();

  const tasks = useMemo<VisitTask[]>(
    () => [
      {
        id: "tsk_001",
        location: "Green Valley Farm",
        address: "Km 12, Lekki-Epe Expressway",
        status: "in_progress",
        eta: "Now",
      },
      {
        id: "tsk_002",
        location: "Sunrise Produce Hub",
        address: "Ibeju-Lekki",
        status: "pending",
        eta: "10:30",
      },
      {
        id: "tsk_003",
        location: "Tawi Cold Room",
        address: "Ajah, Lagos",
        status: "pending",
        eta: "13:15",
      },
      {
        id: "tsk_004",
        location: "Harvest Point",
        address: "Sangotedo",
        status: "done",
        eta: "Completed",
      },
    ],
    []
  );

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    return { done, pending, inProgress, total: tasks.length };
  }, [tasks]);

  const statusPill = (s: VisitTask["status"]) => {
    const map: Record<
      VisitTask["status"],
      { label: string; cls: string }
    > = {
      pending: {
        label: "Pending",
        cls: "border-white/10 bg-zinc-950/30 text-zinc-200/90",
      },
      in_progress: {
        label: "In progress",
        cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      },
      done: {
        label: "Done",
        cls: "border-white/10 bg-white/5 text-zinc-200/80",
      },
    };

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
          map[s].cls
        )}
      >
        {map[s].label}
      </span>
    );
  };

  return (
    <AgentLayout
      title="Agent Dashboard"
      subtitle="Today’s route, visits, and quick actions."
    >
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/45 p-5 shadow-soft backdrop-blur">
            <p className="text-xs text-zinc-300/70">Total visits</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/45 p-5 shadow-soft backdrop-blur">
            <p className="text-xs text-zinc-300/70">In progress</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">
              {stats.inProgress}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/45 p-5 shadow-soft backdrop-blur">
            <p className="text-xs text-zinc-300/70">Pending</p>
            <p className="mt-2 text-2xl font-semibold">{stats.pending}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/45 p-5 shadow-soft backdrop-blur">
            <p className="text-xs text-zinc-300/70">Completed</p>
            <p className="mt-2 text-2xl font-semibold">{stats.done}</p>
          </div>
        </section>

        {/* Quick actions + route list */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/45 p-6 shadow-soft backdrop-blur md:col-span-1">
            <p className="text-sm font-semibold">Quick actions</p>
            <p className="mt-1 text-xs text-zinc-300/70">
              Keep updates fast while you’re on-site.
            </p>

            <div className="mt-4 grid gap-3">
              <Button
                type="button"
                className={cn(
                  "w-full rounded-2xl",
                  "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
                  "shadow-soft hover:shadow-md transition"
                )}
                onClick={() => alert("Hook this to your 'Start Visit' flow")}
              >
                Start a visit
              </Button>

              <button
                type="button"
                className={cn(
                  "w-full rounded-2xl border border-white/10 bg-zinc-950/20 py-2.5 text-sm font-medium transition",
                  "text-zinc-100 hover:bg-white/5",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                )}
                onClick={() => alert("Hook this to your 'Log Outcome' flow")}
              >
                Log an outcome
              </button>

              <button
                type="button"
                className={cn(
                  "w-full rounded-2xl border border-white/10 bg-zinc-950/20 py-2.5 text-sm font-medium transition",
                  "text-zinc-100 hover:bg-white/5",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                )}
                onClick={() => alert("Hook this to your 'Upload Photo' flow")}
              >
                Upload photos
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/45 p-6 shadow-soft backdrop-blur md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Today’s route</p>
                <p className="mt-1 text-xs text-zinc-300/70">
                  Next stops and current visit status.
                </p>
              </div>

              <button
                type="button"
                className={cn(
                  "rounded-xl border border-white/10 bg-zinc-950/20 px-3 py-2 text-sm font-medium transition",
                  "text-zinc-100 hover:bg-white/5",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                )}
                onClick={() => alert("Hook this to your 'Refresh route' logic")}
              >
                Refresh
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    alert(`Open visit details for: ${t.location} (${t.id})`)
                  }
                  className={cn(
                    "group w-full rounded-2xl border border-white/10 bg-zinc-950/20 p-4 text-left transition",
                    "hover:bg-white/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {t.location}
                      </p>
                      <p className="mt-1 text-xs text-zinc-300/70">
                        {t.address}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {statusPill(t.status)}
                      <span className="text-xs text-zinc-300/70">
                        ETA: {t.eta}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-300/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70 opacity-0 transition group-hover:opacity-100" />
                    <span className="opacity-80 group-hover:opacity-100 transition">
                      Tap to view details
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              "text-zinc-200/80 hover:text-zinc-100",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
            )}
            onClick={() => navigate("/", { replace: true })}
          >
            Back to Home
          </button>
        </div>
      </main>
    </AgentLayout>
  );
}