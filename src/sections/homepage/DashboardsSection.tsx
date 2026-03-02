import React, { useMemo, useState } from "react";
import { Button, cn, Container } from "../../components/reusable/atoms";

type ViewKey = "myday" | "verify" | "summary";

type ViewModel = {
  key: ViewKey;
  label: string;
  tagline: string;
  bullets: string[];
  primaryCta: string;
  secondaryCta: string;

  kpis: Array<{ label: string; value: string; tone?: "good" | "warn" | "neutral" }>;
  listTitle: string;
  listRows: Array<{ title: string; meta: string; status: "todo" | "inprogress" | "done" | "flag" }>;
  updates: Array<{ title: string; meta: string }>;
};

function DotPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-semibold text-tawi-dark">
      <span className="h-2 w-2 rounded-full bg-tawi-primary" />
      {children}
    </span>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition",
        "ring-1 ring-black/5",
        active ? "bg-tawi-dark text-white" : "bg-white text-tawi-dark hover:bg-tawi-bg"
      )}
    >
      {children}
    </button>
  );
}

function CardShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-black/5 bg-white shadow-[0_1px_0_rgba(0,0,0,.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function TonePill({ tone, children }: { tone?: "good" | "warn" | "neutral"; children: React.ReactNode }) {
  const styles =
    tone === "good"
      ? "bg-tawi-leaf/35 text-tawi-dark"
      : tone === "warn"
        ? "bg-tawi-bg text-tawi-dark"
        : "bg-tawi-bg text-tawi-charcoal2";
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-black/5", styles)}>{children}</span>;
}

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <div className="text-[11px] font-medium text-tawi-charcoal2/70">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <div className="text-lg font-semibold text-tawi-dark">{value}</div>
        <TonePill tone={tone}>{tone === "good" ? "On track" : tone === "warn" ? "Needs attention" : "Info"}</TonePill>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: "todo" | "inprogress" | "done" | "flag" }) {
  const cls =
    status === "done"
      ? "bg-tawi-primary"
      : status === "inprogress"
        ? "bg-tawi-sage"
        : status === "flag"
          ? "bg-tawi-dark"
          : "bg-tawi-primary/40";
  return <span className={cn("mt-1.5 h-2 w-2 flex-none rounded-full", cls)} />;
}

function PreviewList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ title: string; meta: string; status: "todo" | "inprogress" | "done" | "flag" }>;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-tawi-dark">{title}</div>
        <span className="text-xs font-semibold text-tawi-charcoal2/70">Example</span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.title} className="flex gap-3">
            <StatusDot status={r.status} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-tawi-dark">{r.title}</div>
              <div className="mt-0.5 text-xs text-tawi-charcoal2/70">{r.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-tawi-charcoal2/70">
        This is what users act on daily — tasks, queues, and updates (not just charts).
      </div>
    </div>
  );
}

export function DashboardsSection() {
  const views: ViewModel[] = useMemo(
    () => [
      {
        key: "myday",
        label: "My Day",
        tagline: "Know what to do next: farms, visits, evidence — even offline.",
        bullets: [
          "See today’s assigned farms and routes",
          "Capture evidence quickly (offline-first)",
          "Sync status stays visible so nothing gets lost",
          "Work is automatically organized by farm",
        ],
        primaryCta: "Open My Day",
        secondaryCta: "Read Quick Guide",
        kpis: [
          { label: "Visits planned", value: "8", tone: "neutral" },
          { label: "Evidence pending", value: "2", tone: "warn" },
          { label: "Sync", value: "Ready", tone: "good" },
        ],
        listTitle: "Today’s tasks",
        listRows: [
          { title: "Visit: Farm 12 — capture photos + GPS point", meta: "Due today • 2km away", status: "todo" },
          { title: "Visit: Farm 07 — update crop stage", meta: "Due today • 5km away", status: "inprogress" },
          { title: "Upload evidence: Farm 03", meta: "Waiting for connection", status: "flag" },
        ],
        updates: [
          { title: "Offline draft saved", meta: "A few seconds ago" },
          { title: "Last sync completed", meta: "12 minutes ago" },
          { title: "New assignment added", meta: "Today" },
        ],
      },
      {
        key: "verify",
        label: "Verify",
        tagline: "Keep data trustworthy: review, approve, flag issues early.",
        bullets: [
          "Review submissions in a single queue",
          "Catch missing evidence before it becomes a report problem",
          "Track coverage and quality across teams",
          "Reduce rework with clear statuses",
        ],
        primaryCta: "Open Verification",
        secondaryCta: "View Rules",
        kpis: [
          { label: "Queue", value: "14", tone: "warn" },
          { label: "Approved today", value: "23", tone: "good" },
          { label: "Flags", value: "3", tone: "neutral" },
        ],
        listTitle: "Verification queue",
        listRows: [
          { title: "Farm 21 — missing photo evidence", meta: "Submitted 32m ago", status: "flag" },
          { title: "Farm 09 — boundary update", meta: "Submitted 1h ago", status: "inprogress" },
          { title: "Farm 04 — visit report", meta: "Submitted 3h ago", status: "todo" },
        ],
        updates: [
          { title: "Approved: Farm 18 (visit report)", meta: "6 minutes ago" },
          { title: "Flagged: Farm 21 (missing photos)", meta: "35 minutes ago" },
          { title: "Coverage refreshed", meta: "Today" },
        ],
      },
      {
        key: "summary",
        label: "Summary",
        tagline: "A clear view of progress: coverage, verified totals, and what needs attention.",
        bullets: [
          "See verified totals by region and team",
          "Spot gaps quickly (coverage, delays, quality)",
          "Track trends over time without digging",
          "Export summaries when needed",
        ],
        primaryCta: "Open Summary",
        secondaryCta: "Export Report",
        kpis: [
          { label: "Verified plots", value: "1,284", tone: "good" },
          { label: "Coverage", value: "78%", tone: "neutral" },
          { label: "At risk areas", value: "2", tone: "warn" },
        ],
        listTitle: "Where attention is needed",
        listRows: [
          { title: "Region West — low visit completion", meta: "Coverage below target", status: "flag" },
          { title: "Region North — verification backlog", meta: "Queue growing", status: "inprogress" },
          { title: "Region Central — on track", meta: "Stable performance", status: "done" },
        ],
        updates: [
          { title: "Weekly rollup generated", meta: "Today" },
          { title: "Region snapshot shared", meta: "Yesterday" },
          { title: "Trend view refreshed", meta: "2 days ago" },
        ],
      },
    ],
    []
  );

  const [active, setActive] = useState<ViewKey>("myday");
  const view = views.find((v) => v.key === active) ?? views[0];

  return (
    <section id="dashboards" className="relative border-t border-black/5 bg-white py-20">
      {/* Clean FAANG-ish surface */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-tawi-bg/35" />
        <div className="absolute -top-40 right-[-9rem] h-[22rem] w-[22rem] rounded-full bg-tawi-sage/16 blur-3xl" />
        <div className="absolute -bottom-44 left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-tawi-leaf/12 blur-3xl" />
      </div>

      <Container className="relative">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="motion-safe:animate-fade-up" style={{ animationDelay: "60ms" }}>
            <DotPill>Your workspace</DotPill>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-tawi-dark sm:text-4xl">
              Not dashboards — your daily work, organized
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-tawi-charcoal2/85 sm:text-[15px]">
              This section exists so users know what to expect after sign-in. Each workspace focuses on actions
              people actually take: tasks, verification, and progress — all from the same verified data.
            </p>
          </div>

          <div className="motion-safe:animate-fade-up" style={{ animationDelay: "120ms" }}>
            <Button variant="secondary" className="px-5 py-2.5">
              Open the App
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 motion-safe:animate-fade-up" style={{ animationDelay: "180ms" }}>
          {views.map((v) => (
            <Pill key={v.key} active={v.key === active} onClick={() => setActive(v.key)}>
              {v.label}
            </Pill>
          ))}
        </div>

        {/* Main */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Left: explanation + bullets + CTAs */}
          <div className="lg:col-span-4">
            <div className="motion-safe:animate-fade-up" style={{ animationDelay: "240ms" }}>
              <CardShell className="p-7">
                <div className="text-sm font-semibold text-tawi-dark">{view.label}</div>
                <div className="mt-2 text-sm text-tawi-charcoal2/80">{view.tagline}</div>

                <ul className="mt-4 space-y-2 text-sm text-tawi-charcoal2/85">
                  {view.bullets.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-tawi-primary/80" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 grid gap-3">
                  <Button className="w-full">{view.primaryCta}</Button>
                  <Button variant="secondary" className="w-full">
                    {view.secondaryCta}
                  </Button>
                </div>

                <div className="mt-5 rounded-xl bg-tawi-bg/70 p-3 ring-1 ring-black/5">
                  <div className="text-[11px] font-semibold text-tawi-dark">Why it matters</div>
                  <div className="mt-1 text-xs leading-relaxed text-tawi-charcoal2/80">
                    Users don’t waste time hunting for information. They land on one screen that matches their job.
                  </div>
                </div>
              </CardShell>
            </div>
          </div>

          {/* Right: “preview” */}
          <div className="lg:col-span-8">
            <div className="motion-safe:animate-fade-up" style={{ animationDelay: "300ms" }}>
              <CardShell className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-white px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-tawi-dark">Workspace preview</div>
                    <div className="mt-1 text-xs text-tawi-charcoal2/70">Example layout • tasks • KPIs • updates</div>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full bg-tawi-bg px-3 py-1 text-xs font-semibold text-tawi-dark ring-1 ring-black/5">
                    <span className="h-2 w-2 rounded-full bg-tawi-primary" />
                    {view.label}
                  </span>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-12">
                  {/* KPIs */}
                  <div className="lg:col-span-7">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {view.kpis.map((k) => (
                        <KpiTile key={k.label} label={k.label} value={k.value} tone={k.tone} />
                      ))}
                    </div>

                    <div className="mt-5">
                      <PreviewList title={view.listTitle} rows={view.listRows} />
                    </div>
                  </div>

                  {/* Updates */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-black/5 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-tawi-dark">Updates</div>
                        <span className="text-xs font-semibold text-tawi-charcoal2/70">Example</span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {view.updates.map((u) => (
                          <div key={u.title} className="flex gap-3">
                            <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-tawi-primary/80" />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-tawi-dark">{u.title}</div>
                              <div className="mt-0.5 text-xs text-tawi-charcoal2/70">{u.meta}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-xl bg-tawi-bg p-3 ring-1 ring-black/5">
                        <div className="text-[11px] font-semibold text-tawi-dark">Tip</div>
                        <div className="mt-1 text-xs leading-relaxed text-tawi-charcoal2/80">
                          Updates keep teams aligned — supervisors see issues early, and field staff see what changed.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardShell>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}