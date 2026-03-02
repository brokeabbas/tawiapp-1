import type React from "react";
import { cn, Container } from "../../components/reusable/atoms";

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <li className="flex gap-4">
      <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tawi-leaf/35 text-xs font-bold text-tawi-dark ring-1 ring-tawi-leaf/60">
        {n}
      </div>
      <div>
        <div className="text-sm font-semibold text-tawi-dark">{title}</div>
        <div className="mt-1 text-sm text-tawi-charcoal2/85">{desc}</div>
      </div>
    </li>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-tawi-leaf/30 px-3 py-1 text-xs font-semibold text-tawi-dark ring-1 ring-tawi-leaf/60">
      {children}
    </span>
  );
}

function WorkflowRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-tawi-dark">{label}</div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-tawi-charcoal2/80">
          <span className={cn("h-2 w-2 rounded-full", accent)} />
          {value}
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-tawi-bg ring-1 ring-black/5">
        <div className={cn("h-full w-2/3 rounded-full opacity-80", accent)} />
      </div>
    </div>
  );
}

export function WorkflowSection() {
  return (
    <section id="workflow" className="py-14">
      <Container>
        <div className="rounded-3xl bg-white p-7 shadow-soft ring-1 ring-black/5 md:p-10">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm font-semibold text-tawi-primary">Workflow</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-tawi-dark">
                A simple flow your teams will actually use
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-tawi-charcoal2/85">
                Capture once in the field, validate intelligently, and surface the truth on dashboards—without messy
                spreadsheets.
              </p>

              <ol className="mt-6 space-y-4">
                <Step n="01" title="Map + Register" desc="Capture GPS boundary, farmer identity, and baseline farm details." />
                <Step n="02" title="Verify + Visit" desc="Field officers record visits, evidence, and verification status." />
                <Step n="03" title="Monitor + Decide" desc="Supervisors track performance; executives view summary insights." />
              </ol>

              <div className="mt-7 flex flex-wrap gap-2">
                <Pill>GPS Polygons</Pill>
                <Pill>Farmer IDs</Pill>
                <Pill>Crop Cycles</Pill>
                <Pill>Verification Status</Pill>
                <Pill>Role-Based Views</Pill>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-tawi-bg p-6 ring-1 ring-black/5">
              <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-tawi-leaf/40 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-tawi-sage/35 blur-3xl" />

              <div className="relative space-y-4">
                <WorkflowRow label="Field Officer" value="Capture & sync" accent="bg-tawi-primary" />
                <WorkflowRow label="Supervisor" value="Validate & review" accent="bg-tawi-sage" />
                <WorkflowRow label="Management" value="Insights & reporting" accent="bg-tawi-dark" />
                <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
                  <div className="text-sm font-semibold text-tawi-dark">Data integrity built-in</div>
                  <p className="mt-2 text-sm text-tawi-charcoal2/85">
                    Clean inputs → consistent records → reliable dashboards. Perfect for scaling operations across
                    states and regions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}