import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../components/reusable/atoms";
import { AgentLayout } from "../components/agents";
import { AgentRegisterFarmMobilePage } from "./AgentRegisterFarmMobilePage"; // adjust path if needed

import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type FarmStatus = "draft" | "submitted";

type FarmPointSource = "gps" | "map" | "track";
type FarmPoint = {
  lat: number;
  lng: number;
  accuracyM?: number;
  capturedAt: string;
  source: FarmPointSource;
};

type FarmRegistration = {
  id: string;
  status: FarmStatus;
  createdAt: string;
  submittedAt?: string;

  // boundary
  points?: FarmPoint[];
  centroidLat?: number;
  centroidLng?: number;
  approxAreaHa?: number;

  // legacy-ish “single pin” convenience (we store centroid here)
  lat?: number;
  lng?: number;
  accuracyM?: number;

  farmName: string;
  farmType: "crop" | "livestock" | "mixed";
  address: string;
  city: string;
  lga: string;
  state: string;
  landmark?: string;

  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail?: string;

  sizeHectares?: number;
  mainCrops?: string;
  notes?: string;
};

const LS_KEY = "tawifarms_agent_farm_registrations_v2";

// ✅ New map styles (no API key needed)
const MAP_STYLES = [
  {
    value: "light",
    label: "Light",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  {
    value: "dark",
    label: "Dark",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  { value: "demo", label: "Demo", url: "https://demotiles.maplibre.org/style.json" },
] as const;

function loadRegs(): FarmRegistration[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // tiny migration: if old records have lat/lng but no points, make them a 1-point boundary
    return (parsed as any[]).map((r) => {
      if (r && !r.points && typeof r.lat === "number" && typeof r.lng === "number") {
        return {
          ...r,
          points: [
            {
              lat: r.lat,
              lng: r.lng,
              accuracyM: r.accuracyM,
              capturedAt: r.createdAt ?? new Date().toLocaleString(),
              source: "gps",
            } satisfies FarmPoint,
          ],
        } satisfies FarmRegistration;
      }
      return r as FarmRegistration;
    });
  } catch {
    return [];
  }
}

function saveRegs(list: FarmRegistration[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function nowHuman() {
  return new Date().toLocaleString();
}

function formatCoord(n: number | null, digits = 7) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function statusPill(s: FarmStatus) {
  return s === "submitted"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900",
        className
      )}
      aria-hidden="true"
    />
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold transition",
              active ? "bg-indigo-600 text-white" : "text-zinc-700 hover:bg-zinc-100"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-zinc-200 bg-white shadow-soft",
        className
      )}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-emerald-700">*</span> : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className={cn(
          "h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition",
          "focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/20",
          "placeholder:text-zinc-400"
        )}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-zinc-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition",
          "focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/20"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StepPills({
  step,
  setStep,
  steps,
}: {
  step: number;
  setStep: (n: number) => void;
  steps: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : done
                ? "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                active
                  ? "bg-indigo-100 text-indigo-800"
                  : done
                  ? "bg-zinc-200 text-zinc-800"
                  : "bg-zinc-100 text-zinc-600"
              )}
            >
              {i + 1}
            </span>
            {s}
          </button>
        );
      })}
    </div>
  );
}

/** --- Geometry helpers (no deps) --- */
function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lat2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function approxCentroid(points: FarmPoint[]) {
  if (points.length === 0) return null;
  if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng };
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

function approxPolygonAreaM2(points: FarmPoint[]) {
  // Needs 3+ points; close ring for calculation
  if (points.length < 3) return null;

  const c = approxCentroid(points);
  if (!c) return null;

  const R = 6378137;
  const lat0 = toRad(c.lat);
  const lng0 = toRad(c.lng);

  const xy = points.map((p) => {
    const x = R * (toRad(p.lng) - lng0) * Math.cos(lat0);
    const y = R * (toRad(p.lat) - lat0);
    return { x, y };
  });

  // shoelace (closed)
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    area += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  return Math.abs(area) / 2;
}

function buildBoundaryGeoJson(points: FarmPoint[]) {
  if (points.length < 2) return null;

  const coords = points.map((p) => [p.lng, p.lat] as [number, number]);

  if (points.length >= 3) {
    // polygon (closed ring)
    const ring =
      coords.length &&
      (coords[0][0] !== coords[coords.length - 1][0] ||
        coords[0][1] !== coords[coords.length - 1][1])
        ? [...coords, coords[0]]
        : coords;

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: { kind: "polygon" },
          geometry: {
            type: "Polygon" as const,
            coordinates: [ring],
          },
        },
      ],
    };
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { kind: "line" },
        geometry: {
          type: "LineString" as const,
          coordinates: coords,
        },
      },
    ],
  };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

export default function AgentRegisterFarmPage() {
  // Tailwind lg is 1024px by default
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop == null) {
    return <div className="p-6 text-sm text-zinc-700">Loading…</div>;
  }

  return isDesktop ? <AgentRegisterFarmDesktopPage /> : <AgentRegisterFarmMobilePage />;
}

export function AgentRegisterFarmDesktopPage() {
  const prefersReducedMotion = useReducedMotion();

  const [tab, setTab] = useState<"new" | "history">("new");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [list, setList] = useState<FarmRegistration[]>(() => loadRegs());

  // ✅ Revamped: boundary first, then details
  const STEPS = ["Boundary Capture", "Farm Profile", "Contact", "Review"];
  const [step, setStep] = useState(0);

  // Form state
  const [farmName, setFarmName] = useState("");
  const [farmType, setFarmType] = useState<FarmRegistration["farmType"]>("crop");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [lga, setLga] = useState("");
  const [stateName, setStateName] = useState("");
  const [landmark, setLandmark] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("Owner");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [sizeHectares, setSizeHectares] = useState<string>("");
  const [mainCrops, setMainCrops] = useState("");
  const [notes, setNotes] = useState("");

  // Boundary capture state
  const [points, setPoints] = useState<FarmPoint[]>([]);
  const [tapToAdd, setTapToAdd] = useState(true);

  // Current GPS fix (for guidance + centering)
  const [fixLat, setFixLat] = useState<number | null>(null);
  const [fixLng, setFixLng] = useState<number | null>(null);
  const [fixAccuracyM, setFixAccuracyM] = useState<number | null>(null);

  const [geoState, setGeoState] = useState<"idle" | "locating" | "ok" | "error">("idle");
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Map style picker
  const [mapStyleKey, setMapStyleKey] = useState<(typeof MAP_STYLES)[number]["value"]>("light");
  const mapStyleUrl = useMemo(() => {
    return MAP_STYLES.find((s) => s.value === mapStyleKey)?.url ?? MAP_STYLES[0].url;
  }, [mapStyleKey]);

  useEffect(() => {
    saveRegs(list);
  }, [list]);

  const stats = useMemo(() => {
    const total = list.length;
    const drafts = list.filter((x) => x.status === "draft").length;
    const submitted = list.filter((x) => x.status === "submitted").length;
    return { total, drafts, submitted };
  }, [list]);

  const boundary = useMemo(() => {
    const c = approxCentroid(points);
    const areaM2 = approxPolygonAreaM2(points);
    const areaHa = areaM2 == null ? null : areaM2 / 10_000;
    return {
      count: points.length,
      centroid: c,
      approxAreaHa: areaHa,
      isPolygon: points.length >= 3,
      geojson: buildBoundaryGeoJson(points),
    };
  }, [points]);

  const mapCenter = useMemo(() => {
    // Prefer centroid, then fix, then Lagos default
    const clng = boundary.centroid?.lng ?? fixLng ?? 3.3792;
    const clat = boundary.centroid?.lat ?? fixLat ?? 6.5244;
    const zoom = boundary.count >= 1 ? 15 : fixLat != null && fixLng != null ? 14 : 10;

    return { longitude: clng, latitude: clat, zoom };
  }, [boundary.centroid, boundary.count, fixLat, fixLng]);

  const canRenderMap = typeof window !== "undefined";

  function stopTracking() {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setTracking(false);
  }

  function resetForm() {
    setFarmName("");
    setFarmType("crop");
    setAddress("");
    setCity("");
    setLga("");
    setStateName("");
    setLandmark("");

    setContactName("");
    setContactRole("Owner");
    setContactPhone("");
    setContactEmail("");

    setSizeHectares("");
    setMainCrops("");
    setNotes("");

    setPoints([]);
    setTapToAdd(true);

    setFixLat(null);
    setFixLng(null);
    setFixAccuracyM(null);
    setGeoState("idle");
    setMsg(null);
    setStep(0);

    stopTracking();
  }

  function validate(): string | null {
    if (!farmName.trim()) return "Farm name is required.";
    if (!address.trim()) return "Address is required.";
    if (!city.trim()) return "City/Town is required.";
    if (!lga.trim()) return "LGA is required.";
    if (!stateName.trim()) return "State is required.";
    if (!contactName.trim()) return "Contact name is required.";
    if (!contactPhone.trim()) return "Contact phone is required.";
    return null;
  }

  function addPoint(p: Omit<FarmPoint, "capturedAt"> & { capturedAt?: string }) {
    setPoints((prev) => {
      if (prev.length >= 250) return prev;
      return [...prev, { ...p, capturedAt: p.capturedAt ?? nowHuman() }];
    });
  }

  function undoLastPoint() {
    setPoints((prev) => prev.slice(0, -1));
  }

  function removePointAt(i: number) {
    setPoints((prev) => prev.filter((_, idx) => idx !== i));
  }

  function clearPoints() {
    setPoints([]);
    setMsg("Boundary cleared.");
  }

  function captureGpsPointOnce() {
    if (!navigator.geolocation) {
      setGeoState("error");
      setMsg("Geolocation not supported in this browser.");
      return;
    }

    setGeoState("locating");
    setMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = pos.coords;
        setFixLat(c.latitude);
        setFixLng(c.longitude);
        setFixAccuracyM(c.accuracy ?? null);
        setGeoState("ok");

        addPoint({
          lat: c.latitude,
          lng: c.longitude,
          accuracyM: c.accuracy ?? undefined,
          source: "gps",
        });

        setMsg("GPS point captured ✅ Add more points to outline the farm.");
      },
      (err) => {
        setGeoState("error");
        setMsg(err.message || "Failed to capture GPS point.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 45_000 }
    );
  }

  function toggleTrackingWalk() {
    if (!navigator.geolocation) {
      setGeoState("error");
      setMsg("Geolocation not supported in this browser.");
      return;
    }

    if (tracking) {
      stopTracking();
      setMsg("Auto-walk capture stopped.");
      return;
    }

    setGeoState("locating");
    setMsg("Auto-walk capture started… Walk the boundary corners.");

    const MIN_DISTANCE_M = 12;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        setFixLat(c.latitude);
        setFixLng(c.longitude);
        setFixAccuracyM(c.accuracy ?? null);
        setGeoState("ok");

        setPoints((prev) => {
          const nextPoint: FarmPoint = {
            lat: c.latitude,
            lng: c.longitude,
            accuracyM: c.accuracy ?? undefined,
            capturedAt: nowHuman(),
            source: "track",
          };

          if (prev.length === 0) return [nextPoint];

          const last = prev[prev.length - 1];
          const d = haversineMeters(last.lat, last.lng, nextPoint.lat, nextPoint.lng);
          if (d < MIN_DISTANCE_M) return prev;

          if (prev.length >= 250) return prev;
          return [...prev, nextPoint];
        });
      },
      (err) => {
        setGeoState("error");
        setMsg(err.message || "Auto-walk capture error.");
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 45_000 }
    );

    watchIdRef.current = id;
    setTracking(true);
  }

  function makeRecord(status: FarmStatus): FarmRegistration {
    const id =
      (crypto as any)?.randomUUID?.() ?? `farm_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const sizeNum = sizeHectares.trim() ? Number(sizeHectares) : undefined;

    const centroid = boundary.centroid;
    const approxAreaHa = boundary.approxAreaHa ?? undefined;

    const mainLat = centroid?.lat ?? (points.length ? points[0].lat : fixLat ?? undefined) ?? undefined;
    const mainLng = centroid?.lng ?? (points.length ? points[0].lng : fixLng ?? undefined) ?? undefined;

    return {
      id,
      status,
      createdAt: nowHuman(),
      submittedAt: status === "submitted" ? nowHuman() : undefined,

      points: points.length ? points : undefined,
      centroidLat: centroid?.lat,
      centroidLng: centroid?.lng,
      approxAreaHa,

      lat: mainLat,
      lng: mainLng,
      accuracyM: fixAccuracyM ?? (points[points.length - 1]?.accuracyM ?? undefined),

      farmName: farmName.trim(),
      farmType,
      address: address.trim(),
      city: city.trim(),
      lga: lga.trim(),
      state: stateName.trim(),
      landmark: landmark.trim() || undefined,

      contactName: contactName.trim(),
      contactRole: contactRole.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim() || undefined,

      sizeHectares: Number.isFinite(sizeNum as number) ? sizeNum : undefined,
      mainCrops: mainCrops.trim() || undefined,
      notes: notes.trim() || undefined,
    };
  }

  async function onDraft() {
    const err = validate();
    if (err) {
      setMsg(err);
      setTab("new");
      return;
    }

    setSaving(true);
    try {
      const rec = makeRecord("draft");
      setList((prev) => [rec, ...prev].slice(0, 50));
      setMsg("Saved as draft ✅");
      setTab("history");
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitToManager() {
    const err = validate();
    if (err) {
      setMsg(err);
      setTab("new");
      return;
    }

    setSaving(true);
    try {
      const rec = makeRecord("submitted");
      setList((prev) => [rec, ...prev].slice(0, 50));
      setMsg("Submitted to Location Manager ✅");
      setTab("history");
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  const headerMotion = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

  return (
    <AgentLayout
      title="Farm Registration"
      subtitle="Capture boundary points first, then complete the farm profile — verification-ready submissions."
    >
      <main className="w-full px-4 py-8 sm:px-6">
        {/* Top HUD */}
        <motion.div {...headerMotion} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 md:grid-cols-3">
              <GlassCard className="p-4">
                <p className="text-[11px] font-semibold tracking-wide text-zinc-500">TOTAL</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.total}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-[11px] font-semibold tracking-wide text-zinc-500">DRAFTS</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.drafts}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-[11px] font-semibold tracking-wide text-zinc-500">SUBMITTED</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">{stats.submitted}</p>
              </GlassCard>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                value={tab}
                onChange={(v) => setTab(v as any)}
                options={[
                  { value: "new", label: "New" },
                  { value: "history", label: "Submissions" },
                ]}
              />
              {tab === "new" ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className={cn(
                    "rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold",
                    "text-zinc-900 hover:bg-zinc-50 transition",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                  )}
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          {msg ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-soft">
              {msg}
            </div>
          ) : null}
        </motion.div>

        {/* NEW */}
        {tab === "new" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            {/* LEFT: Wizard */}
            <GlassCard className="overflow-hidden">
              <div className="border-b border-zinc-200 bg-zinc-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Registration flow</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Capture boundary points first, then fill farm and contact details.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-zinc-600">
                    Step <span className="text-zinc-900">{step + 1}</span> / {STEPS.length}
                  </div>
                </div>

                <div className="mt-4">
                  <StepPills step={step} setStep={setStep} steps={STEPS} />
                </div>
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  {/* STEP 0: Boundary Capture */}
                  {step === 0 ? (
                    <motion.div
                      key="s0"
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.22 }}
                      className="grid gap-4"
                    >
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">Boundary capture</p>
                            <p className="mt-1 text-xs text-zinc-600">
                              Small farm? Capture 1 point. Large farm? Add points around the edges
                              (corners/turns) or use auto-walk.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                                geoState === "ok"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : geoState === "locating"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : geoState === "error"
                                  ? "border-rose-200 bg-rose-50 text-rose-800"
                                  : "border-zinc-200 bg-white text-zinc-600"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex h-2.5 w-2.5 rounded-full",
                                  geoState === "ok"
                                    ? "bg-emerald-500"
                                    : geoState === "locating"
                                    ? "bg-amber-500"
                                    : geoState === "error"
                                    ? "bg-rose-500"
                                    : "bg-zinc-400"
                                )}
                              />
                              {geoState === "idle"
                                ? "GPS idle"
                                : geoState === "locating"
                                ? "GPS locating…"
                                : geoState === "ok"
                                ? "GPS ready"
                                : "GPS error"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={captureGpsPointOnce}
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold",
                              "text-zinc-900 hover:bg-zinc-100 transition",
                              "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                            )}
                          >
                            {geoState === "locating" ? <Spinner /> : null}
                            Add GPS point
                          </button>

                          <button
                            type="button"
                            onClick={toggleTrackingWalk}
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold transition",
                              tracking
                                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                : "bg-white text-zinc-900 hover:bg-zinc-100",
                              "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/25"
                            )}
                          >
                            {tracking ? "Stop auto-walk" : "Start auto-walk"}
                          </button>
                        </div>

                        <div className="mt-3 grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600">Points captured</span>
                            <span className="font-semibold text-zinc-900">{boundary.count}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600">Centroid</span>
                            <span className="font-mono">
                              {formatCoord(boundary.centroid?.lat ?? null, 6)},{" "}
                              {formatCoord(boundary.centroid?.lng ?? null, 6)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600">Approx area</span>
                            <span className="font-semibold">
                              {boundary.approxAreaHa == null ? "—" : `${boundary.approxAreaHa.toFixed(2)} ha`}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Tip: turn on <span className="font-semibold text-zinc-700">Tap to add</span>{" "}
                            and tap corners/edges on the map preview.
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTapToAdd((v) => !v)}
                            className={cn(
                              "rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                              tapToAdd
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                            )}
                          >
                            {tapToAdd ? "Tap to add: ON" : "Tap to add: OFF"}
                          </button>

                          <button
                            type="button"
                            onClick={undoLastPoint}
                            disabled={points.length === 0}
                            className={cn(
                              "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 transition",
                              "hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            Undo last
                          </button>

                          <button
                            type="button"
                            onClick={clearPoints}
                            disabled={points.length === 0}
                            className={cn(
                              "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 transition",
                              "hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            Clear all
                          </button>

                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={cn(
                              "ml-auto inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition",
                              "hover:bg-emerald-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                            )}
                          >
                            Continue →
                          </button>
                        </div>
                      </div>

                      {/* Points list */}
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-zinc-900">Captured points</p>
                          <p className="text-xs text-zinc-600">
                            {points.length === 0 ? "None yet" : `${points.length} total`}
                          </p>
                        </div>

                        {points.length === 0 ? (
                          <div className="mt-3 text-sm text-zinc-600">
                            Add a GPS point or tap the map preview to start.
                          </div>
                        ) : (
                          <div className="mt-3 grid gap-2">
                            {points.map((p, i) => (
                              <div
                                key={`${p.capturedAt}_${i}`}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-800">
                                      {i + 1}
                                    </span>
                                    <span className="text-xs font-semibold text-zinc-800">
                                      {p.source.toUpperCase()}
                                    </span>
                                    <span className="text-[11px] text-zinc-500">{p.capturedAt}</span>
                                  </div>
                                  <div className="mt-1 font-mono text-[11px] text-zinc-700">
                                    {formatCoord(p.lat, 6)}, {formatCoord(p.lng, 6)}
                                    {typeof p.accuracyM === "number" ? ` • ±${Math.round(p.accuracyM)}m` : ""}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removePointAt(i)}
                                  className={cn(
                                    "rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900",
                                    "hover:bg-zinc-100 transition"
                                  )}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : null}

                  {/* STEP 1: FARM */}
                  {step === 1 ? (
                    <motion.div
                      key="s1"
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.22 }}
                      className="grid gap-4"
                    >
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-sm font-semibold text-zinc-900">Farm profile</p>

                        {points.length === 0 ? (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            No boundary points yet. You can continue, but verification will be slower.
                            Go back and capture at least 1 point if possible.
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-4">
                          <Field
                            label="Farm name"
                            required
                            value={farmName}
                            onChange={setFarmName}
                            placeholder="e.g., Green Valley Farm"
                          />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <SelectField
                              label="Farm type"
                              value={farmType}
                              onChange={(v) => setFarmType(v as any)}
                              options={[
                                { value: "crop", label: "Crop" },
                                { value: "livestock", label: "Livestock" },
                                { value: "mixed", label: "Mixed" },
                              ]}
                            />
                            <Field
                              label="Size (hectares)"
                              value={sizeHectares}
                              onChange={setSizeHectares}
                              placeholder="e.g., 12.5"
                              inputMode="decimal"
                            />
                          </div>

                          <Field
                            label="Address"
                            required
                            value={address}
                            onChange={setAddress}
                            placeholder="Street / route / area"
                          />

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="City/Town" required value={city} onChange={setCity} placeholder="e.g., Ajah" />
                            <Field label="LGA" required value={lga} onChange={setLga} placeholder="e.g., Ibeju-Lekki" />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="State" required value={stateName} onChange={setStateName} placeholder="e.g., Lagos" />
                            <Field label="Landmark (optional)" value={landmark} onChange={setLandmark} placeholder="Nearby landmark" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          className={cn(
                            "rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900",
                            "hover:bg-zinc-100 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                          )}
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className={cn(
                            "ml-auto rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition",
                            "hover:bg-emerald-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                          )}
                        >
                          Continue →
                        </button>
                      </div>
                    </motion.div>
                  ) : null}

                  {/* STEP 2: CONTACT */}
                  {step === 2 ? (
                    <motion.div
                      key="s2"
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.22 }}
                      className="grid gap-4"
                    >
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-sm font-semibold text-zinc-900">Farmer / contact</p>

                        <div className="mt-4 grid gap-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Name" required value={contactName} onChange={setContactName} placeholder="e.g., Amina Bello" />
                            <Field label="Role" value={contactRole} onChange={setContactRole} placeholder="Owner / Manager" />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Phone" required value={contactPhone} onChange={setContactPhone} placeholder="+234 801 234 5678" />
                            <Field label="Email (optional)" value={contactEmail} onChange={setContactEmail} placeholder="optional@email.com" type="email" />
                          </div>

                          <Field
                            label="Main crops / livestock (optional)"
                            value={mainCrops}
                            onChange={setMainCrops}
                            placeholder="e.g., tomatoes, pepper, poultry"
                          />

                          <label className="grid gap-2">
                            <span className="text-xs font-semibold text-zinc-700">Notes</span>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className={cn(
                                "min-h-[110px] rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition",
                                "focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/20",
                                "placeholder:text-zinc-400"
                              )}
                              placeholder="Any helpful instructions or observations…"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className={cn(
                            "rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900",
                            "hover:bg-zinc-100 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                          )}
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className={cn(
                            "ml-auto rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition",
                            "hover:bg-emerald-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                          )}
                        >
                          Review →
                        </button>
                      </div>
                    </motion.div>
                  ) : null}

                  {/* STEP 3: REVIEW */}
                  {step === 3 ? (
                    <motion.div
                      key="s3"
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.22 }}
                      className="grid gap-4"
                    >
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-sm font-semibold text-zinc-900">Verification snapshot</p>

                        <div className="mt-3 grid gap-2 text-sm text-zinc-700">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-zinc-600">Farm</span>
                            <span className="font-semibold text-zinc-900">{farmName || "—"}</span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-zinc-600">Boundary points</span>
                            <span className="font-semibold">{boundary.count || "—"}</span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-zinc-600">Approx area</span>
                            <span className="font-semibold">
                              {boundary.approxAreaHa == null ? "—" : `${boundary.approxAreaHa.toFixed(2)} ha`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-zinc-600">Location</span>
                            <span className="text-right text-xs text-zinc-700">
                              {city || "—"}, {lga || "—"}, {stateName || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-zinc-600">Contact</span>
                            <span className="text-right text-xs text-zinc-700">
                              {contactName || "—"} • {contactPhone || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-zinc-600">Centroid pin</span>
                            <span className="font-mono text-xs">
                              {formatCoord(boundary.centroid?.lat ?? null, 6)},{" "}
                              {formatCoord(boundary.centroid?.lng ?? null, 6)}
                            </span>
                          </div>
                        </div>

                        {points.length === 0 ? (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            No boundary points captured yet. You can still submit, but verification will be slower.
                          </div>
                        ) : null}

                        {(() => {
                          const err = validate();
                          return err ? (
                            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                              {err}
                            </div>
                          ) : null;
                        })()}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className={cn(
                            "rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900",
                            "hover:bg-zinc-100 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                          )}
                        >
                          ← Back
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={onDraft}
                          className={cn(
                            "ml-auto rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition",
                            "hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed",
                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                          )}
                        >
                          {saving ? "Saving…" : "Save draft"}
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={onSubmitToManager}
                          className={cn(
                            "rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition",
                            "hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed",
                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                          )}
                        >
                          {saving ? "Submitting…" : "Submit"}
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="border-t border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>🔒 Stored locally on this device</span>
                  <span className="font-semibold text-zinc-700">v2</span>
                </div>
              </div>
            </GlassCard>

            {/* RIGHT: Map preview */}
            <GlassCard className="overflow-hidden">
              <div className="border-b border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Map preview</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Preview boundary (map is secondary). Tap-to-add is{" "}
                      <span className="font-semibold text-zinc-700">{tapToAdd ? "ON" : "OFF"}</span>.
                    </p>
                  </div>

                  <Segmented
                    value={mapStyleKey}
                    onChange={(v) => setMapStyleKey(v as any)}
                    options={MAP_STYLES.map((s) => ({ value: s.value, label: s.label }))}
                  />
                </div>

                <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">GPS fix</span>
                    <span className="font-mono">
                      {formatCoord(fixLat, 6)}, {formatCoord(fixLng, 6)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-zinc-600">Accuracy</span>
                    <span className="font-semibold">
                      {fixAccuracyM == null ? "—" : `±${Math.round(fixAccuracyM)}m`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[340px] w-full">
                {canRenderMap ? (
                  <Map
                    mapLib={maplibregl as any}
                    mapStyle={mapStyleUrl}
                    initialViewState={mapCenter}
                    dragPan
                    scrollZoom
                    touchPitch
                    touchZoomRotate
                    attributionControl={false}
                    onClick={(e) => {
                      if (!tapToAdd) return;
                      const [clng, clat] = e.lngLat.toArray();
                      addPoint({ lat: clat, lng: clng, source: "map" });
                      setMsg("Point added from map ✅");
                    }}
                    cursor={tapToAdd ? "crosshair" : "grab"}
                  >
                    <div className="absolute left-3 top-3 z-10">
                      <NavigationControl showZoom showCompass visualizePitch />
                    </div>

                    {/* boundary line/polygon */}
                    {boundary.geojson ? (
                      <Source id="boundary" type="geojson" data={boundary.geojson as any}>
                        <Layer
                          id="boundary-line"
                          type="line"
                          paint={{
                            "line-color": "rgba(16, 185, 129, 0.9)", // emerald-ish
                            "line-width": 3,
                          }}
                        />
                        {boundary.isPolygon ? (
                          <Layer
                            id="boundary-fill"
                            type="fill"
                            paint={{
                              "fill-color": "rgba(16, 185, 129, 0.12)",
                              "fill-outline-color": "rgba(16, 185, 129, 0.35)",
                            }}
                          />
                        ) : null}
                      </Source>
                    ) : null}

                    {/* markers */}
                    {points.map((p, i) => (
                      <Marker key={`${p.capturedAt}_${i}`} latitude={p.lat} longitude={p.lng} anchor="bottom">
                        <div className="relative">
                          <div className="absolute -inset-5 rounded-full bg-emerald-500/10 blur-xl" />
                          <div className="relative grid place-items-center">
                            <div className="h-9 w-9 rounded-full border border-zinc-200 bg-white/90 shadow-soft backdrop-blur grid place-items-center">
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 grid place-items-center">
                                <span className="text-[11px] font-extrabold text-emerald-800">
                                  {i + 1}
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 h-3.5 w-3.5 rotate-45 rounded-sm bg-white/95 border border-zinc-200 shadow-soft" />
                          </div>
                        </div>
                      </Marker>
                    ))}
                  </Map>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-zinc-600">Map loading…</div>
                )}
              </div>

              <div className="border-t border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={captureGpsPointOnce}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold",
                      "text-zinc-900 hover:bg-zinc-100 transition"
                    )}
                  >
                    {geoState === "locating" ? <Spinner /> : null}
                    GPS point
                  </button>

                  <button
                    type="button"
                    onClick={toggleTrackingWalk}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-xs font-semibold transition",
                      tracking
                        ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        : "bg-white text-zinc-900 hover:bg-zinc-100"
                    )}
                  >
                    {tracking ? "Stop walk" : "Auto-walk"}
                  </button>

                  <a
                    href={
                      boundary.centroid
                        ? `https://www.google.com/maps?q=${encodeURIComponent(
                            `${boundary.centroid.lat},${boundary.centroid.lng}`
                          )}`
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "ml-auto inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold",
                      "text-zinc-900 hover:bg-zinc-100 transition",
                      !boundary.centroid ? "pointer-events-none opacity-50" : ""
                    )}
                  >
                    Open centroid ↗
                  </a>
                </div>
              </div>
            </GlassCard>
          </section>
        ) : (
          // HISTORY
          <section className="mt-6">
            <GlassCard className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Submissions</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Drafts and submissions captured from the boundary system.
                  </p>
                </div>

                <button
                  type="button"
                  className={cn(
                    "rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold transition",
                    "text-zinc-900 hover:bg-zinc-100",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                  )}
                  onClick={() => {
                    if (!confirm("Clear all registrations? (dev only)")) return;
                    setList([]);
                    saveRegs([]);
                  }}
                >
                  Clear (dev)
                </button>
              </div>

              {list.length === 0 ? (
                <div className="mt-6 text-sm text-zinc-600">No registrations yet.</div>
              ) : (
                <div className="mt-6 grid gap-3">
                  {list.map((r) => {
                    const count = r.points?.length ?? (r.lat != null && r.lng != null ? 1 : 0);
                    return (
                      <div
                        key={r.id}
                        className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-soft"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-zinc-900">{r.farmName}</p>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                  statusPill(r.status)
                                )}
                              >
                                {r.status === "submitted" ? "Submitted" : "Draft"}
                              </span>
                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600">
                                {count} pt{count === 1 ? "" : "s"}
                                {typeof r.approxAreaHa === "number" ? ` • ~${r.approxAreaHa.toFixed(2)}ha` : ""}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-zinc-600">
                              {r.farmType.toUpperCase()}
                              {r.sizeHectares ? ` · ${r.sizeHectares}ha` : ""} · {r.city}, {r.lga},{" "}
                              {r.state}
                            </p>

                            <p className="mt-2 text-xs text-zinc-600">
                              <span className="font-semibold text-zinc-800">{r.contactName}</span> • {r.contactPhone}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
                              Created: <span className="text-zinc-800">{r.createdAt}</span>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
                              Submitted: <span className="text-zinc-800">{r.submittedAt ?? "—"}</span>
                            </div>

                            <a
                              className={cn(
                                "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold",
                                "text-zinc-900 hover:bg-zinc-100 transition",
                                r.lat == null || r.lng == null ? "pointer-events-none opacity-50" : ""
                              )}
                              href={
                                r.lat != null && r.lng != null
                                  ? `https://www.google.com/maps?q=${encodeURIComponent(`${r.lat},${r.lng}`)}`
                                  : undefined
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View centroid ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </section>
        )}
      </main>
    </AgentLayout>
  );
}