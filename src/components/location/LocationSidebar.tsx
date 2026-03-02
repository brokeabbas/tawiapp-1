import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../reusable/atoms";
import logo from "../../assets/logo.png";

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  enabled?: boolean;
};

export default function LocationSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        label: "Overview",
        path: "/location/dashboard",
        enabled: true,
        icon: (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 13h8V3H3v10z" />
            <path d="M13 21h8V11h-8v10z" />
            <path d="M13 3h8v6h-8V3z" />
            <path d="M3 17h8v4H3v-4z" />
          </svg>
        ),
      },
      {
        label: "My Location",
        path: "/location/my-location",
        enabled: true,
        icon: (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z" />
            <path d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        ),
      },
      {
        label: "Captured Farms",
        path: "/location/captured-farms",
        enabled: true,
        icon: (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
            <path d="M9 22V12h6v10" />
          </svg>
        ),
      },
      {
        label: "My Agents",
        path: "/location/my-agents",
        enabled: true,
        icon: (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21a8 8 0 10-16 0" />
            <path d="M12 13a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
        ),
      },
      {
        label: "Profile",
        path: "/location/profile",
        enabled: false,
        icon: (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
            <path d="M4 21a8 8 0 0116 0" />
          </svg>
        ),
      },
    ],
    []
  );

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const onNavClick = (item: NavItem) => {
    if (item.enabled) {
      navigate(item.path, { replace: true });
      return;
    }
    alert(`Hook this route: ${item.path}`);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-zinc-200 bg-white/80 backdrop-blur md:flex">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className={cn(
            "inline-flex items-center rounded-xl p-1.5",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30"
          )}
          aria-label="Go to home"
        >
          <img
            src={logo}
            alt="Tawi"
            className="h-10 w-auto object-contain"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </button>

        <div className="leading-tight">
          <p className="text-sm font-semibold text-zinc-900">Location Manager</p>
          <p className="text-xs text-zinc-600">Operations overview</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3">
        <p className="px-2 pb-2 text-xs font-medium tracking-wide text-zinc-600">
          Navigation
        </p>

        <div className="grid gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavClick(item)}
              className={cn(
                "group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20",
                isActive(item.path)
                  ? "bg-indigo-50 text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg border",
                  isActive(item.path)
                    ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                    : "border-zinc-200 bg-white text-zinc-600"
                )}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto px-4 pb-4 pt-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-600">
            Tip: Review yesterday’s activity before assigning today’s work.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className={cn(
            "mt-3 w-full rounded-2xl border border-zinc-200 bg-white py-2.5 text-sm font-medium transition",
            "text-zinc-900 hover:bg-zinc-50",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
          )}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}