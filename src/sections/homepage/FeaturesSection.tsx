import type React from "react";
import { Button, Container } from "../../components/reusable/atoms";

/* ---------- Minimal inline icons (no deps) ---------- */
function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 3v15" stroke="currentColor" strokeWidth="2" />
      <path d="M15 6v15" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 10-8 0 4 4 0 0 0 8 0z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconChecklist() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6h12M9 12h12M9 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M3.5 6l1.5 1.5L7.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 12l1.5 1.5 2.5-2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 18l1.5 1.5 2.5-2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 4h7v7H4V4zM13 4h7v4h-7V4zM13 10h7v10h-7V10zM4 13h7v7H4v-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7 15l3-3 3 2 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-semibold text-tawi-dark">
      <span className="h-2 w-2 rounded-full bg-tawi-primary" />
      {children}
    </span>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
  meta,
  index,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  meta: string;
  index: number;
}) {
  return (
    <div
      className="motion-safe:animate-fade-up"
      style={{ animationDelay: `${120 + index * 70}ms` }}
    >
      <div className="group h-full rounded-2xl border border-black/5 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,.04)] transition-all duration-200 hover:-translate-y-1 hover:border-tawi-leaf/60 hover:shadow-soft">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-tawi-bg ring-1 ring-black/5 text-tawi-dark">
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-base font-semibold text-tawi-dark">{title}</div>
              <span className="inline-flex items-center rounded-full bg-tawi-bg px-2.5 py-0.5 text-[11px] font-semibold text-tawi-charcoal2/80 ring-1 ring-black/5">
                {meta}
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-tawi-charcoal2/85">{desc}</p>

            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tawi-primary opacity-90 transition group-hover:opacity-100">
              Learn more
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HIGHLIGHTS = ["Offline capture", "Audit trails", "Role-based access", "Export-ready"];

const STEPS: Array<{ title: string; desc: string }> = [
  { title: "Capture", desc: "Field teams record farms, visits, and evidence—offline when needed." },
  { title: "Verify", desc: "Validation rules and workflows reduce errors and standardize data." },
  { title: "Act", desc: "Dashboards surface what matters for supervisors and leadership." },
];

const FEATURES: Array<{
  title: string;
  desc: string;
  icon: React.ReactNode;
  meta: string;
}> = [
  {
    title: "GPS Farm Mapping",
    desc: "Capture boundaries and verification points with consistent geo-referenced records across regions.",
    icon: <IconMap />,
    meta: "Geo",
  },
  {
    title: "Farmer & Crop Registry",
    desc: "Maintain profiles, crop cycles, inputs and outcomes with stable IDs and traceable history.",
    icon: <IconUsers />,
    meta: "Registry",
  },
  {
    title: "Field Visit Management",
    desc: "Plan visits, collect evidence, sync reports, and keep a clean activity timeline per farm.",
    icon: <IconChecklist />,
    meta: "Ops",
  },
  {
    title: "Quality & Verification",
    desc: "Completeness checks, status workflows, and validation rules help prevent bad data upstream.",
    icon: <IconShield />,
    meta: "QA",
  },
  {
    title: "Role-Based Dashboards",
    desc: "Separate views for field officers, supervisors, and executives—each seeing the right signals.",
    icon: <IconDashboard />,
    meta: "Dashboards",
  },
  {
    title: "Insights & Export",
    desc: "Generate summaries and decision-ready snapshots for reporting, compliance, and planning.",
    icon: <IconChart />,
    meta: "Reporting",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative border-t border-black/5 bg-white py-20">
      {/* FAANG-ish subtle section surface (clean, not flashy) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-tawi-bg/40" />
        <div className="absolute -top-40 right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-tawi-sage/18 blur-3xl" />
        <div className="absolute -bottom-44 left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-tawi-leaf/14 blur-3xl" />
      </div>

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* LEFT: story + proof + steps */}
          <div className="lg:col-span-5">
            <div className="motion-safe:animate-fade-up" style={{ animationDelay: "60ms" }}>
              <DotPill>Core capabilities</DotPill>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-tawi-dark sm:text-4xl">
                Built for real operations — from field to executive view
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-tawi-charcoal2/85 sm:text-[15px]">
                A clean system for capture, verification, and visibility. Standardize how data is collected in the field
                and how decisions are made at the top.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {HIGHLIGHTS.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-tawi-bg px-3 py-1 text-xs font-semibold text-tawi-dark ring-1 ring-black/5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Steps block */}
            <div
              className="mt-8 motion-safe:animate-fade-up"
              style={{ animationDelay: "140ms" }}
            >
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,.04)]">
                <div className="text-sm font-semibold text-tawi-dark">How it works</div>

                <div className="mt-4 grid gap-4">
                  {STEPS.map((s, i) => (
                    <div key={s.title} className="flex gap-3">
                      <div className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-tawi-bg text-xs font-bold text-tawi-dark ring-1 ring-black/5">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-tawi-dark">{s.title}</div>
                        <div className="mt-1 text-sm leading-relaxed text-tawi-charcoal2/85">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button className="px-5 py-2.5">Explore the Platform</Button>
                  <Button variant="secondary" className="px-5 py-2.5">
                    Download Overview
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: feature grid + callout */}
          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f, idx) => (
                <FeatureCard
                  key={f.title}
                  title={f.title}
                  desc={f.desc}
                  icon={f.icon}
                  meta={f.meta}
                  index={idx}
                />
              ))}
            </div>

            {/* Bottom callout (FAANG style: simple, high-contrast, clear) */}
            <div
              className="mt-6 motion-safe:animate-fade-up"
              style={{ animationDelay: "600ms" }}
            >
              <div className="rounded-2xl border border-black/5 bg-tawi-bg/60 p-6 ring-1 ring-white/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-tawi-dark">
                      Reporting that leadership can trust
                    </div>
                    <p className="mt-1 text-sm text-tawi-charcoal2/80">
                      Export-ready summaries, verification status, and operational snapshots—clean enough for decision
                      meetings.
                    </p>
                  </div>
                  <Button variant="secondary" className="px-5 py-2.5">
                    View Feature Tour
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}