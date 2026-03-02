import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../components/reusable/atoms";
import logo from "../assets/logo.png";

type Role = "agent" | "location_manager";

export default function LoginPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("agent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleUI = useMemo(() => {
    if (role === "agent") {
      return {
        pill: "Agent",
        heading: "You’re an Agent — ready for the field.",
        subheading:
          "Log visits, capture outcomes, and keep your route moving smoothly.",
        tips: [
          {
            title: "Stay on track",
            desc: "Your tasks and check-ins are designed for quick updates while you’re on-site.",
          },
          {
            title: "Record outcomes fast",
            desc: "Capture notes, photos, and status in seconds—no busywork.",
          },
          {
            title: "Reliable in the field",
            desc: "Clear UI states, fewer clicks, and a workflow that won’t slow you down.",
          },
        ],
        footerNote:
          "Tip: Prep your route before you head out—signal can be spotty.",
      };
    }

    return {
      pill: "Location manager",
      heading: "You’re a Location Manager — oversee the operation.",
      subheading:
        "Review activity, manage locations, and keep performance consistent across sites.",
      tips: [
        {
          title: "Visibility across teams",
          desc: "See what’s happening across locations without digging through messages.",
        },
        {
          title: "Keep data clean",
          desc: "Standardize updates so reports and audits stay accurate.",
        },
        {
          title: "Spot issues early",
          desc: "Catch delays and anomalies quickly—before they impact the day’s work.",
        },
      ],
      footerNote:
        "Tip: Review yesterday’s activity before assigning today’s work.",
    };
  }, [role]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    // simple email check (prevents “nothing happens” feeling)
    const emailOk = /^\S+@\S+\.\S+$/.test(trimmedEmail);
    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      console.log("SUBMIT FIRED ✅", { role, email: trimmedEmail, password });

      // fake delay (replace with real API call)
      await new Promise((r) => setTimeout(r, 600));

      if (role === "agent") {
        navigate("/agent", { replace: true });
      } else {
        navigate("/location/dashboard", { replace: true }); // ✅ change
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
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
        @keyframes tawiRoleSwap {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
      `}</style>

      {/* Top-left logo */}
      <div className="absolute left-4 top-4 z-30 sm:left-6 sm:top-6">
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className={cn(
            "group inline-flex items-center rounded-xl p-1.5",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30"
          )}
          aria-label="Go to home"
        >
<img
  src={logo}
  alt="Tawi"
  className="h-20 w-auto object-contain sm:h-24 lg:h-28 xl:h-32"
  loading="eager"
  decoding="async"
  draggable={false}
/>
        </button>
      </div>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(34,197,94,0.20), rgba(161,98,7,0.14), rgba(16,185,129,0.12), rgba(9,9,11,0.0))",
            backgroundSize: "240% 240%",
            animation: "tawiGradientShift 16s ease-in-out infinite",
          }}
        />

        <div
          className="absolute left-1/2 top-[-320px] h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.18), rgba(9,9,11,0) 60%)",
            animation: "tawiFloat 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[-260px] top-[18%] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(161,98,7,0.12), rgba(9,9,11,0) 60%)",
            animation: "tawiFloat 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-260px] left-[-260px] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.10), rgba(9,9,11,0) 60%)",
            animation: "tawiFloat 11s ease-in-out infinite",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, rgba(255,255,255,0.00) 1px, rgba(255,255,255,0.00) 14px)",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(9,9,11,0)_0%,rgba(9,9,11,0.55)_70%,rgba(9,9,11,0.9)_100%)]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full items-stretch gap-6 md:grid-cols-2">
          {/* Left tips */}
          <section className="hidden overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/35 p-8 shadow-soft backdrop-blur md:flex md:flex-col">
            <div
              key={role}
              className="motion-reduce:animate-none"
              style={{ animation: "tawiRoleSwap 280ms ease-out both" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold tracking-tight text-zinc-100">
                    {roleUI.heading}
                  </p>
                  <p className="mt-1 text-xs text-zinc-300/70">
                    {roleUI.subheading}
                  </p>
                </div>

                <span className="inline-flex items-center rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-xs font-medium text-zinc-200/90">
                  {roleUI.pill}
                </span>
              </div>

              <div className="mt-8 grid gap-3">
                {roleUI.tips.map((x) => (
                  <div
                    key={x.title}
                    className="rounded-2xl border border-white/10 bg-zinc-950/25 p-4"
                  >
                    <p className="text-sm font-semibold text-zinc-100">
                      {x.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-300/75">
                      {x.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/25 p-4">
                  <p className="text-xs text-zinc-300/70">{roleUI.footerNote}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Right form */}
          <section className="flex items-center">
            <div className="w-full rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-soft backdrop-blur sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                    Welcome back
                  </h1>
                  <p className="mt-1 text-sm text-zinc-300/80">
                    Sign in to continue to your dashboard.
                  </p>
                </div>

                <span
                  key={role}
                  className="mt-0.5 inline-flex items-center rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-xs font-medium text-zinc-200/90 motion-reduce:animate-none"
                  style={{ animation: "tawiRoleSwap 220ms ease-out both" }}
                >
                  {roleUI.pill}
                </span>
              </div>

              {/* Mobile tips */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/25 p-4 md:hidden">
                <div
                  key={role}
                  className="motion-reduce:animate-none"
                  style={{ animation: "tawiRoleSwap 260ms ease-out both" }}
                >
                  <p className="text-sm font-semibold text-zinc-100">
                    {roleUI.heading}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-300/75">
                    {roleUI.subheading}
                  </p>
                </div>
              </div>

              {/* Role segmented */}
              <div className="mt-6">
                <p className="text-sm font-medium text-zinc-100">Role</p>

                <div
                  role="radiogroup"
                  aria-label="Role"
                  className="relative mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-950/40 p-1 ring-1 ring-white/10"
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-1 left-1",
                      "w-[calc(50%-0.25rem)] rounded-xl bg-zinc-900 shadow-soft",
                      "transition-transform duration-300 ease-out",
                      "motion-reduce:transition-none",
                      role === "agent" ? "translate-x-0" : "translate-x-full"
                    )}
                  />

                  <button
                    type="button"
                    role="radio"
                    aria-checked={role === "agent"}
                    onClick={() => setRole("agent")}
                    className={cn(
                      "relative z-10 h-10 rounded-xl text-sm font-medium transition",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20",
                      role === "agent"
                        ? "text-zinc-100"
                        : "text-zinc-300/80 hover:text-zinc-100"
                    )}
                  >
                    Agent
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={role === "location_manager"}
                    onClick={() => setRole("location_manager")}
                    className={cn(
                      "relative z-10 h-10 rounded-xl text-sm font-medium transition",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20",
                      role === "location_manager"
                        ? "text-zinc-100"
                        : "text-zinc-300/80 hover:text-zinc-100"
                    )}
                  >
                    Location manager
                  </button>
                </div>

                <p className="mt-2 text-xs text-zinc-300/70">
                  Choose the account type you’re signing in with.
                </p>
              </div>

              {/* Form */}
              <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-4">
                {error && (
                  <div
                    className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                )}

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-100" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className={cn(
                      "h-11 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 text-sm text-zinc-100 outline-none transition",
                      "placeholder:text-zinc-400/60",
                      "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/15"
                    )}
                    placeholder="you@company.com"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-100" htmlFor="password">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className={cn(
                        "h-11 w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-3 pr-14 text-sm text-zinc-100 outline-none transition",
                        "placeholder:text-zinc-400/60",
                        "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/15"
                      )}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition",
                        "text-zinc-300/80 hover:bg-white/5 hover:text-zinc-100",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                      )}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-300/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-zinc-950/30 text-emerald-400 focus:ring-4 focus:ring-emerald-400/20"
                    />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="rounded-lg px-1 py-1 text-sm font-medium text-zinc-200/80 transition hover:text-zinc-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                    onClick={() => alert("Hook this to your reset flow")}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* ✅ Native button => guaranteed submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "mt-2 w-full rounded-2xl py-2.5 text-sm font-semibold",
                    "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
                    "shadow-soft hover:shadow-md transition",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                >
                  {submitting ? "Logging in..." : "Log in"}
                </button>

                <button
                  type="button"
                  className={cn(
                    "w-full rounded-2xl border border-white/10 bg-zinc-950/20 py-2.5 text-sm font-medium transition",
                    "text-zinc-100 hover:bg-white/5",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                  )}
                  onClick={() => navigate("/", { replace: true })}
                >
                  Back to Home
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}