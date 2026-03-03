import { motion, useReducedMotion } from "framer-motion";
import { Button, Container, cn } from "../../components/reusable/atoms";
import logo from "../../assets/logo1.jpeg";
import farmerBg from "../../assets/bg6.webp";

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 6.5 9.2 17.3 4 12.1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/25 bg-white/55 p-4",
        "shadow-[0_18px_45px_-35px_rgba(0,0,0,.55)] backdrop-blur-md",
        "transition hover:-translate-y-0.5 hover:bg-white/65"
      )}
    >
      <div className="text-[11px] font-medium tracking-wide text-zinc-700/75">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-950">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-zinc-700/70">{hint}</div> : null}
    </div>
  );
}

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  const parent = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
  };

  const item = {
    hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.section
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      variants={parent}
      className="relative overflow-hidden text-zinc-950"
    >
      <style>{`
        @keyframes tawiGradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes tawiFloat {
          0%   { transform: translate3d(0,0,0); }
          50%  { transform: translate3d(0,-14px,0); }
          100% { transform: translate3d(0,0,0); }
        }
      `}</style>

      {/* Background (more visible, readability handled mostly by the glass content panel) */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={farmerBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.08] contrast-[1.08]"
          draggable={false}
          loading="eager"
          decoding="async"
        />

        {/* Keep background visible: light wash + left-to-right readability */}
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/18 to-transparent" />

        {/* Brand tint */}
        <div
          className="absolute inset-0 opacity-65"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(34,197,94,0.18), rgba(245,158,11,0.14), rgba(16,185,129,0.12), rgba(255,255,255,0))",
            backgroundSize: "240% 240%",
            animation: reduceMotion ? undefined : "tawiGradientShift 16s ease-in-out infinite",
          }}
        />

        {/* Soft glows */}
        <div
          className="absolute left-1/2 top-[-320px] h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.16), rgba(255,255,255,0) 60%)",
            animation: reduceMotion ? undefined : "tawiFloat 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[-260px] top-[18%] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.14), rgba(255,255,255,0) 60%)",
            animation: reduceMotion ? undefined : "tawiFloat 12s ease-in-out infinite",
          }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 14px)",
          }}
        />
      </div>

      <Container className="relative py-14 md:py-20">
        {/* Glass panel = makes everything feel blended */}
        <div
          className={cn(
            "max-w-2xl rounded-3xl border border-white/25 bg-white/35",
            "backdrop-blur-lg shadow-[0_30px_90px_-60px_rgba(0,0,0,.65)]",
            "p-6 sm:p-8"
          )}
        >
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/55 px-3 py-1 text-xs font-semibold text-zinc-800"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Field capture • Verification • Visibility
          </motion.div>

          {/* ✅ Removed the small: logo | divider | Agri Verify row */}

          {/* Big logo (keep as the hero “title”) */}
          <motion.div variants={item} className="mt-6">
            <img
              src={logo}
              alt="TAWI Agri Verify"
              className={cn(
                "h-20 w-auto object-contain sm:h-24 md:h-28",
                "rounded-2xl",
                "drop-shadow-[0_18px_36px_rgba(0,0,0,0.22)]"
              )}
              draggable={false}
              loading="eager"
              decoding="async"
            />
          </motion.div>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-base leading-relaxed text-zinc-800 md:text-[17px]"
          >
            Everything you need to complete field work, submit evidence, and keep records consistent —{" "}
            <span className="font-semibold text-zinc-950">online or offline</span>. When you sign in,
            you land on a workspace built for the job you’re doing.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-6 grid gap-2 text-sm text-zinc-800 sm:grid-cols-2"
          >
            {[
              "My Day: tasks, farms, routes",
              "Capture evidence with validation prompts",
              "Verify submissions and fix issues early",
              "Summary view for progress and exports",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/55 text-emerald-600 ring-1 ring-white/25 shadow-[0_10px_26px_-20px_rgba(0,0,0,.45)]">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <span>{t}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              className={cn(
                "px-5 py-2.5 rounded-2xl",
                "bg-emerald-600 text-white hover:bg-emerald-500",
                "shadow-[0_14px_40px_-26px_rgba(16,185,129,.65)] hover:shadow-[0_18px_50px_-28px_rgba(16,185,129,.7)] transition"
              )}
            >
              Open the App
            </Button>

            <Button
              variant="secondary"
              className={cn(
                "px-5 py-2.5 rounded-2xl",
                "border border-white/25 bg-white/45 text-zinc-900",
                "hover:bg-white/60 transition"
              )}
            >
              Quick start guide
            </Button>
          </motion.div>

          <motion.div variants={item} className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="My Day" value="Tasks & routes" hint="Start work fast" />
            <StatCard label="Capture" value="Offline-first" hint="Sync when online" />
            <StatCard label="Verify" value="Clean records" hint="Trusted data" />
          </motion.div>

          <motion.div variants={item} className="mt-7 text-xs text-zinc-800/80">
            Built for <span className="font-semibold text-zinc-950">Tawi Farms</span> — field efficiency,
            verification accuracy, and traceable records.
          </motion.div>
        </div>
      </Container>
    </motion.section>
  );
}