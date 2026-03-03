import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Container, cn } from "./atoms";
import logo from "../../assets/logo1.jpeg";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <>
          <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function ReusableNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur">
      {/* slightly taller header to comfortably fit a much bigger logo */}
      <Container className="flex h-20 items-center justify-between">
        {/* Logo */}
        <Link to="/" aria-label="Home" className="inline-flex items-center">
          <img
            src={logo}
            alt="Tawi"
            className={cn(
              // WAY bigger logo (responsive)
              "h-14 w-auto object-contain sm:h-16 md:h-16 lg:h-18 xl:h-20",
              // make sure it never overflows the bar
              "max-h-[72px] md:max-h-[80px]"
            )}
            loading="eager"
            decoding="async"
          />
        </Link>

        {/* Desktop nav (hide on login page) */}
        {!isLoginPage && (
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            <a
              className="text-sm font-medium text-tawi-charcoal2/80 transition hover:text-tawi-dark"
              href="#about"
            >
              About us
            </a>
            <a
              className="text-sm font-medium text-tawi-charcoal2/80 transition hover:text-tawi-dark"
              href="#help"
            >
              Help
            </a>
            <a
              className="text-sm font-medium text-tawi-charcoal2/80 transition hover:text-tawi-dark"
              href="#contact"
            >
              Contact
            </a>
          </nav>
        )}

        {/* CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          {isLoginPage ? (
            <Button variant="ghost" onClick={() => navigate("/")}>
              Back Home
            </Button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-tawi-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-tawi-dark"
            >
              Log In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2 text-tawi-dark ring-1 ring-black/5 transition hover:bg-tawi-bg md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
      </Container>

      {/* Mobile drawer */}
      <div className={cn("md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        {/* Overlay */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/20 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          className={cn(
            // top offset updated because header height is now h-20
            "fixed left-0 right-0 top-20 z-50 origin-top rounded-b-2xl border-b border-black/5 bg-white shadow-soft transition-all",
            open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          )}
          role="dialog"
          aria-label="Menu"
        >
          <Container className="py-4">
            {!isLoginPage && (
              <div className="grid gap-1">
                {[
                  { label: "About us", href: "#about" },
                  { label: "Help", href: "#help" },
                  { label: "Contact", href: "#contact" },
                ].map((x) => (
                  <a
                    key={x.href}
                    href={x.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-tawi-dark transition hover:bg-tawi-bg"
                  >
                    {x.label}
                  </a>
                ))}
              </div>
            )}

            <div className="mt-4 grid gap-2">
              {isLoginPage ? (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    navigate("/");
                  }}
                >
                  Back Home
                </Button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-tawi-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-tawi-dark"
                >
                  Log In
                </Link>
              )}
            </div>
          </Container>
        </div>
      </div>
    </header>
  );
}