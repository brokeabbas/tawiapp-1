import logo from "../../assets/logo.png"; // ✅ adjust if needed
import { Container, cn } from "./atoms";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-zinc-950 text-zinc-100">
      {/* Subtle background like Login/Hero */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(34,197,94,0.18), rgba(161,98,7,0.12), rgba(16,185,129,0.10), rgba(9,9,11,0.0))",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, rgba(255,255,255,0.00) 1px, rgba(255,255,255,0.00) 14px)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(9,9,11,0)_0%,rgba(9,9,11,0.60)_70%,rgba(9,9,11,0.92)_100%)]" />
      </div>

      <Container className="relative py-10">
        <div
          className={cn(
            "flex flex-col gap-6 md:flex-row md:items-center md:justify-between",
            "rounded-3xl border border-white/10 bg-zinc-900/35 p-6 shadow-soft backdrop-blur"
          )}
        >
          {/* Brand */}
          <a
            href="/"
            className={cn(
              "inline-flex items-center gap-3 rounded-2xl",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
            )}
            aria-label="Go to home"
          >
            <span
              className={cn(
                "grid place-items-center rounded-2xl bg-white/90 ring-1 ring-black/10",
                "h-12 w-12 sm:h-14 sm:w-14",
                "shadow-xl shadow-black/25"
              )}
            >
              <img
                src={logo}
                alt="Tawi"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
                draggable={false}
              />
            </span>

            {/* Optional brand text (remove if you want logo-only) */}
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-zinc-100">
                Tawi Farms
              </div>
              <div className="text-xs text-zinc-300/70">
                Agri Verify Platform
              </div>
            </div>
          </a>

          {/* Links + copyright */}
          <div className="flex flex-col gap-3 md:items-end">
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a
                href="/"
                className="text-zinc-300/80 transition hover:text-zinc-100"
              >
                Home
              </a>
              <a
                href="/login"
                className="text-zinc-300/80 transition hover:text-zinc-100"
              >
                Login
              </a>
              <button
                type="button"
                onClick={() => alert("Hook this to your support flow")}
                className="text-zinc-300/80 transition hover:text-zinc-100"
              >
                Support
              </button>
            </nav>

            <div className="text-xs text-zinc-300/70">
              © {new Date().getFullYear()} Tawi Farms • Agri Verify Platform
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}