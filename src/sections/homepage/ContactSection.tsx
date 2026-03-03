import { Button, Container, cn } from "../../components/reusable/atoms";
import { Link } from "react-router-dom";
import logo from "../../assets/logo1.jpeg";

export function ContactSection() {
  return (
    <section id="contact" className="py-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tawi-dark to-tawi-primary p-8 shadow-soft md:p-12">
          {/* Ambient glows */}
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          {/* Subtle pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.18), transparent 35%), radial-gradient(circle at 80% 75%, rgba(255,255,255,0.14), transparent 40%)",
            }}
          />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* Left: Logo (nav style) + Copy */}
            <div className="flex items-start gap-5">
              <Link to="/" aria-label="Home" className="inline-flex items-center">
                <img
                  src={logo}
                  alt="Tawi"
                  className="h-12 w-auto object-contain sm:h-14"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </Link>

              <div>
                <h3 className="text-2xl font-semibold text-white md:text-3xl">
                  Ready to map, verify, and manage farms with confidence?
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-white/85">
                  Let’s build the platform step-by-step: authentication, roles, farm mapping, farmer registry, field
                  visits, and dashboards.
                </p>

                {/* Quick highlights */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    "Offline-first capture",
                    "Evidence-backed verification",
                    "Role-based dashboards",
                    "Export-ready reports",
                  ].map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: CTAs */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {/* Get Started (solid, visible text on non-hover) */}
              <Link
                to="/"
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition sm:w-auto",
                  "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                )}
              >
                Get started
              </Link>

              {/* Log In (not white background; readable on gradient) */}
              <Link
                to="/login"
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition sm:w-auto",
                  "border border-white/20 bg-white/10 text-white hover:bg-white/15",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                )}
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Bottom fine print */}
          <div className="relative mt-8 border-t border-white/15 pt-5">
            <p className="text-xs text-white/75">
              Tip: Start with “Get started” to explore the platform, or “Log in” if you already have access.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}