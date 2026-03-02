import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button, Container, cn } from "../../components/reusable/atoms";
import logo from "../../assets/logo.png";

/** Small utility: deterministic RNG (SSR-safe) */
function hashStringToSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

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

function PinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 22s7-5 7-12a7 7 0 1 0-14 0c0 7 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
        stroke="currentColor"
        strokeWidth="2"
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
        "group relative rounded-2xl border border-black/10 bg-white/70 p-4",
        "shadow-[0_12px_40px_-24px_rgba(0,0,0,.35)] backdrop-blur",
        "transition hover:-translate-y-0.5 hover:bg-white/85"
      )}
    >
      <div className="text-[11px] font-medium tracking-wide text-zinc-700/70">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-950">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-zinc-700/65">{hint}</div> : null}
    </div>
  );
}

function MiniMapPremiumMock() {
  const reactId = useId();
  const reduceMotion = useReducedMotion();

  const dots = useMemo(() => {
    const rand = mulberry32(hashStringToSeed(`tawi-map-${reactId}`));
    return Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      top: rand() * 100,
      left: rand() * 100,
      size: 3.5 + rand() * 6.5,
      op: 0.22 + rand() * 0.45,
      type: rand() > 0.78 ? "pin" : "dot",
      delay: rand() * 1.2,
    }));
  }, [reactId]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      className="relative"
    >
      {/* Light-mode glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />

      {/* Light glass frame */}
      <motion.div
        className={cn(
          "relative rounded-[28px] border border-black/10 bg-white/70",
          "shadow-[0_40px_120px_-80px_rgba(0,0,0,.55)] backdrop-blur"
        )}
        animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
        transition={reduceMotion ? undefined : { duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative overflow-hidden rounded-[28px]">
          {/* map surface */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/70" />

            {/* grid */}
            <div
              className="absolute inset-0 opacity-[0.12] mix-blend-multiply"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(0,0,0,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.14) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />

            {/* accent radials */}
            <div className="absolute inset-0 bg-[radial-gradient(700px_420px_at_25%_20%,rgba(16,185,129,.20),transparent_60%),radial-gradient(620px_420px_at_80%_70%,rgba(245,158,11,.18),transparent_62%)]" />
          </div>

          {/* points */}
          {dots.map((d) => (
            <span
              key={d.id}
              className={
                d.type === "pin"
                  ? "absolute -translate-x-1/2 -translate-y-1/2"
                  : "absolute rounded-full bg-emerald-500"
              }
              style={{
                top: `${d.top}%`,
                left: `${d.left}%`,
                width: d.type === "pin" ? undefined : `${d.size}px`,
                height: d.type === "pin" ? undefined : `${d.size}px`,
                opacity: d.op,
              }}
            >
              {d.type === "pin" ? (
                <motion.span
                  className="grid place-items-center rounded-full bg-white/65 p-1 ring-1 ring-black/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,.45)] backdrop-blur"
                  initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
                  animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: 0.2 + d.delay }}
                >
                  <motion.span
                    className="grid place-items-center rounded-full bg-emerald-500/10 p-1"
                    animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
                    transition={
                      reduceMotion
                        ? undefined
                        : { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: d.delay }
                    }
                  >
                    <PinIcon className="h-3.5 w-3.5 text-zinc-900" />
                  </motion.span>
                </motion.span>
              ) : (
                <motion.span
                  className="block h-full w-full rounded-full"
                  animate={reduceMotion ? undefined : { scale: [1, 1.22, 1] }}
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: d.delay }
                  }
                />
              )}
            </span>
          ))}

          {/* preview content (LOGO ONLY) */}
          <div className="relative p-6">
            <div className="flex min-h-[320px] items-center justify-center">
              <img
                src={logo}
                alt="Tawi"
                className="h-28 w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.28)] sm:h-32 md:h-36 lg:h-40"
                draggable={false}
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/65 to-transparent" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  const parent = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 },
    },
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
      className="relative overflow-hidden bg-zinc-50 text-zinc-950"
    >
      {/* Light-mode background + micro-animations */}
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

      {/* Background layer (light vibe) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(34,197,94,0.16), rgba(245,158,11,0.12), rgba(16,185,129,0.10), rgba(255,255,255,0.0))",
            backgroundSize: "240% 240%",
            animation: "tawiGradientShift 16s ease-in-out infinite",
          }}
        />

        <div
          className="absolute left-1/2 top-[-320px] h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.20), rgba(255,255,255,0) 60%)",
            animation: "tawiFloat 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[-260px] top-[18%] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.18), rgba(255,255,255,0) 60%)",
            animation: "tawiFloat 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-260px] left-[-260px] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.14), rgba(255,255,255,0) 60%)",
            animation: "tawiFloat 11s ease-in-out infinite",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-multiply"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, rgba(0,0,0,0.00) 1px, rgba(0,0,0,0.00) 14px)",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0.55)_70%,rgba(255,255,255,0.95)_100%)]" />
      </div>

      <Container className="relative grid items-center gap-12 py-14 md:grid-cols-2 md:py-20">
        {/* LEFT */}
        <div>
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Field capture • Verification • Traceability
          </motion.div>

          <motion.h1
            variants={item}
            className="font-heading mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl"
          >
            Agri Verify Workspace
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-base leading-relaxed text-zinc-700 md:text-[17px]"
          >
            Everything you need to complete field work, submit evidence, and keep records consistent —{" "}
            <span className="font-semibold text-zinc-900">online or offline</span>. When you sign in,
            you land on a workspace built for the job you’re doing.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-6 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2"
          >
            {[
              "My Day: tasks, farms, routes",
              "Capture evidence with validation prompts",
              "Verify submissions and fix issues early",
              "Summary view for progress and exports",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-emerald-600 ring-1 ring-black/10 shadow-[0_10px_26px_-20px_rgba(0,0,0,.45)]">
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
                "border border-black/10 bg-white/60 text-zinc-900",
                "hover:bg-white/80 transition"
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

          <motion.div variants={item} className="mt-7 text-xs text-zinc-700/80">
            Built for <span className="font-semibold text-zinc-900">Tawi Farms</span> — field efficiency,
            verification accuracy, and traceable records.
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="relative">
          <MiniMapPremiumMock />
        </div>
      </Container>
    </motion.section>
  );
}