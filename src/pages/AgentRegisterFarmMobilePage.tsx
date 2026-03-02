import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../components/reusable/atoms";
import { AgentLayout } from "../components/agents";

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

  points?: FarmPoint[];
  centroidLat?: number;
  centroidLng?: number;
  approxAreaHa?: number;

  // convenience pin (centroid)
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

const MAP_STYLES = [
  { value: "light", label: "Light", url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
  { value: "dark", label: "Dark", url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { value: "demo", label: "Demo", url: "https://demotiles.maplibre.org/style.json" },
] as const;

/** ---------------- Icons (inline, no deps) ---------------- */
function Icon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const I = {
  Plus: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  ),
  Clock: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M12 8v5l3 2" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </Icon>
  ),
  ChevronLeft: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  ),
  ChevronRight: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M9 18l6-6-6-6" />
    </Icon>
  ),
  Locate: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10z" />
    </Icon>
  ),
  Walk: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M16 6a2 2 0 1 1-4 0a2 2 0 0 1 4 0z" />
      <path d="M9 20l2-6 2-2 2 2 1 6" />
      <path d="M10 10l2 1 3-2" />
      <path d="M7 12l3-2" />
    </Icon>
  ),
  Undo: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M9 14l-4-4 4-4" />
      <path d="M20 20a8 8 0 0 0-11-7h-4" />
    </Icon>
  ),
  Trash: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Icon>
  ),
  Check: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M20 6L9 17l-5-5" />
    </Icon>
  ),
  Send: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Icon>
  ),
  Save: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </Icon>
  ),
  Pin: (p: { className?: string }) => (
    <Icon className={p.className}>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <path d="M12 10a2.2 2.2 0 1 0 0 4.4A2.2 2.2 0 0 0 12 10z" />
    </Icon>
  ),
};

/** ---------------- Storage helpers ---------------- */
function loadRegs(): FarmRegistration[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // migration: if legacy lat/lng exists but no points
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

function formatCoord(n: number | null, digits = 6) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

/** ---------------- Geometry helpers ---------------- */
function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function approxCentroid(points: FarmPoint[]) {
  if (points.length === 0) return null;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}
function approxPolygonAreaM2(points: FarmPoint[]) {
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
    const ring =
      coords.length &&
      (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
        ? [...coords, coords[0]]
        : coords;

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: { kind: "polygon" },
          geometry: { type: "Polygon" as const, coordinates: [ring] },
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
        geometry: { type: "LineString" as const, coordinates: coords },
      },
    ],
  };
}

/** ---------------- iOS-ish UI primitives (LIGHT ONLY) ---------------- */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70", className)}
      aria-hidden="true"
    />
  );
}

function IOSCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-black/5 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.10)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function IOSPill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-black/80 backdrop-blur",
        className
      )}
    >
      {children}
    </span>
  );
}

function IOSButton({
  className,
  variant = "secondary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-[rgb(0,122,255)] text-white shadow-[0_10px_20px_rgba(0,122,255,0.25)] hover:brightness-95"
      : variant === "destructive"
      ? "bg-[rgb(255,59,48)] text-white shadow-[0_10px_20px_rgba(255,59,48,0.20)] hover:brightness-95"
      : variant === "ghost"
      ? "bg-transparent text-black/70 hover:bg-black/5"
      : "border border-black/10 bg-white/60 text-black/80 hover:bg-white/80";

  return (
    <button className={cn(base, styles, className)} {...props}>
      {children}
    </button>
  );
}

function IOSSegmented({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 rounded-2xl border border-black/10 bg-black/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        className
      )}
      role="tablist"
      aria-label="Tabs"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
              active
                ? "bg-white text-black shadow-[0_8px_18px_rgba(0,0,0,0.10)]"
                : "text-black/60 hover:bg-white/40"
            )}
            role="tab"
            aria-selected={active}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function IOSFormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-black/85">{label}</p>
          {required ? <span className="text-[11px] font-bold text-[rgb(255,59,48)]">*</span> : null}
        </div>
      </div>
      <div className="min-w-[52%]">{children}</div>
    </div>
  );
}

function IOSInput({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      className={cn(
        "h-10 w-full rounded-xl border border-black/10 bg-white/70 px-3 text-[13px] text-black/85 outline-none",
        "placeholder:text-black/35 focus:border-[rgb(0,122,255)] focus:ring-4 focus:ring-[rgba(0,122,255,0.18)]"
      )}
    />
  );
}

function IOSSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 w-full appearance-none rounded-xl border border-black/10 bg-white/70 px-3 text-[13px] font-semibold text-black/80 outline-none",
        "focus:border-[rgb(0,122,255)] focus:ring-4 focus:ring-[rgba(0,122,255,0.18)]"
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function IOSTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-[13px] text-black/85 outline-none",
        "placeholder:text-black/35 focus:border-[rgb(0,122,255)] focus:ring-4 focus:ring-[rgba(0,122,255,0.18)]"
      )}
    />
  );
}

function MobileToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-4 border-t border-black/10 bg-white/70 px-4 py-3 backdrop-blur-xl",
        "pb-[calc(env(safe-area-inset-bottom)+12px)]"
      )}
    >
      {children}
    </div>
  );
}

/** ---------------- Page ---------------- */
export function AgentRegisterFarmMobilePage() {
  const prefersReducedMotion = useReducedMotion();

  const [tab, setTab] = useState<"new" | "history">("new");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<FarmRegistration[]>(() => loadRegs());

  const STEPS = ["Boundary", "Farm", "Contact", "Review"];
  const [step, setStep] = useState(0);

  // boundary capture state
  const [points, setPoints] = useState<FarmPoint[]>([]);
  const [tapToAdd, setTapToAdd] = useState(true);

  // current GPS fix
  const [fixLat, setFixLat] = useState<number | null>(null);
  const [fixLng, setFixLng] = useState<number | null>(null);
  const [fixAccuracyM, setFixAccuracyM] = useState<number | null>(null);

  const [geoState, setGeoState] = useState<"idle" | "locating" | "ok" | "error">("idle");
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // map style (default light)
  const [mapStyleKey, setMapStyleKey] = useState<(typeof MAP_STYLES)[number]["value"]>("light");
  const mapStyleUrl = useMemo(
    () => MAP_STYLES.find((s) => s.value === mapStyleKey)?.url ?? MAP_STYLES[0].url,
    [mapStyleKey]
  );

  // form fields
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
    const centroid = approxCentroid(points);
    const areaM2 = approxPolygonAreaM2(points);
    const areaHa = areaM2 == null ? null : areaM2 / 10_000;
    return {
      count: points.length,
      centroid,
      approxAreaHa: areaHa,
      isPolygon: points.length >= 3,
      geojson: buildBoundaryGeoJson(points),
    };
  }, [points]);

  const mapCenter = useMemo(() => {
    const clng = boundary.centroid?.lng ?? fixLng ?? 3.3792;
    const clat = boundary.centroid?.lat ?? fixLat ?? 6.5244;
    const zoom = boundary.count ? 16 : fixLat != null && fixLng != null ? 14 : 10;
    return { longitude: clng, latitude: clat, zoom };
  }, [boundary.centroid, boundary.count, fixLat, fixLng]);

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

  function stopTracking() {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setTracking(false);
  }

  function resetForm() {
    setPoints([]);
    setTapToAdd(true);

    setFixLat(null);
    setFixLng(null);
    setFixAccuracyM(null);
    setGeoState("idle");
    stopTracking();

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

    setMsg(null);
    setStep(0);
  }

  function addPoint(p: Omit<FarmPoint, "capturedAt"> & { capturedAt?: string }) {
    setPoints((prev) => {
      if (prev.length >= 250) return prev;
      return [...prev, { ...p, capturedAt: p.capturedAt ?? nowHuman() }];
    });
    try {
      navigator.vibrate?.(8);
    } catch {}
  }

  function undoLastPoint() {
    setPoints((prev) => prev.slice(0, -1));
    try {
      navigator.vibrate?.(8);
    } catch {}
  }

  function clearPoints() {
    setPoints([]);
    setMsg("Boundary cleared.");
    try {
      navigator.vibrate?.(12);
    } catch {}
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

        addPoint({ lat: c.latitude, lng: c.longitude, accuracyM: c.accuracy ?? undefined, source: "gps" });
        setMsg("GPS point captured ✅ Add more points to cover the farm.");
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
      setMsg("Auto-walk stopped.");
      return;
    }

    setGeoState("locating");
    setMsg("Auto-walk started… walk corners/edges.");

    const MIN_DISTANCE_M = 12;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        setFixLat(c.latitude);
        setFixLng(c.longitude);
        setFixAccuracyM(c.accuracy ?? null);
        setGeoState("ok");

        setPoints((prev) => {
          const next: FarmPoint = {
            lat: c.latitude,
            lng: c.longitude,
            accuracyM: c.accuracy ?? undefined,
            capturedAt: nowHuman(),
            source: "track",
          };

          if (prev.length === 0) return [next];

          const last = prev[prev.length - 1];
          const d = haversineMeters(last.lat, last.lng, next.lat, next.lng);
          if (d < MIN_DISTANCE_M) return prev;
          if (prev.length >= 250) return prev;
          return [...prev, next];
        });
      },
      (err) => {
        setGeoState("error");
        setMsg(err.message || "Auto-walk error.");
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

    const mainLat = centroid?.lat ?? (points[0]?.lat ?? fixLat ?? undefined);
    const mainLng = centroid?.lng ?? (points[0]?.lng ?? fixLng ?? undefined);

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
      accuracyM: fixAccuracyM ?? points[points.length - 1]?.accuracyM,

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
    if (err) return setMsg(err);

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
    if (err) return setMsg(err);

    setSaving(true);
    try {
      const rec = makeRecord("submitted");
      setList((prev) => [rec, ...prev].slice(0, 50));
      setMsg("Submitted ✅");
      setTab("history");
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  const headerMotion = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } };

  const progress = (step + 1) / STEPS.length;

  return (
    <AgentLayout title="Farm Registration" subtitle="Capture boundary points, then add details.">
      <main
        className={cn(
          "w-full px-4",
          "bg-[rgb(242,242,247)] text-[rgb(28,28,30)]",
          "min-h-[calc(100dvh-0px)]",
          "pb-[calc(env(safe-area-inset-bottom)+16px)]"
        )}
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          fontFamily:
            'system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",Arial,sans-serif',
        }}
      >
        {/* iOS Nav */}
        <div className="sticky top-0 z-40 -mx-4 px-4">
          <div className="rounded-b-[28px] border-b border-black/10 bg-white/70 backdrop-blur-xl">
            <motion.div {...headerMotion} className="px-4 pt-3 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[20px] font-extrabold tracking-tight text-black/90">Farm Registration</p>
                  <p className="mt-1 text-[12px] text-black/55">Capture boundary points, then add details.</p>
                </div>

                <div className="flex items-center gap-2">
                  <IOSPill className="px-2.5">
                    <span className="text-[11px] font-bold">{stats.total}</span>
                    <span className="text-[11px] text-black/55">total</span>
                  </IOSPill>
                  <IOSPill className="px-2.5">
                    <span className="text-[11px] font-bold">{stats.submitted}</span>
                    <span className="text-[11px] text-black/55">submitted</span>
                  </IOSPill>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <IOSSegmented
                  value={tab}
                  onChange={(v) => setTab(v as any)}
                  options={[
                    { value: "new", label: "New", icon: <I.Plus className="h-4 w-4" /> },
                    { value: "history", label: "History", icon: <I.Clock className="h-4 w-4" /> },
                  ]}
                  className="w-full"
                />
              </div>

              {/* Progress (only in “new”) */}
              {tab === "new" ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-black/70">
                      {STEPS[step]}{" "}
                      <span className="font-normal text-black/45">
                        • Step {step + 1}/{STEPS.length}
                      </span>
                    </p>
                    <p className="text-[12px] font-semibold text-black/50">{Math.round(progress * 100)}%</p>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-black/10">
                    <div
                      className="h-2 rounded-full bg-[rgb(0,122,255)] transition-all"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {msg ? (
                <div className="mt-3 rounded-2xl border border-black/10 bg-white/70 p-3 text-[13px] text-black/80">
                  {msg}
                </div>
              ) : null}
            </motion.div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-4">
          {tab === "history" ? (
            <section className="grid gap-4 pb-6">
              <IOSCard className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="text-[14px] font-extrabold text-black/90">Submissions</p>
                    <p className="mt-1 text-[12px] text-black/55">Drafts and submissions (local device).</p>
                  </div>

                  <IOSButton
                    variant="secondary"
                    onClick={() => {
                      if (!confirm("Clear all registrations? (dev only)")) return;
                      setList([]);
                      saveRegs([]);
                    }}
                  >
                    <I.Trash className="h-4 w-4" />
                    Clear
                  </IOSButton>
                </div>

                <div className="border-t border-black/10">
                  {list.length === 0 ? (
                    <div className="px-4 py-4 text-[13px] text-black/60">No registrations yet.</div>
                  ) : (
                    <div className="divide-y divide-black/10">
                      {list.map((r) => {
                        const count = r.points?.length ?? (r.lat != null && r.lng != null ? 1 : 0);
                        const pill =
                          r.status === "submitted"
                            ? "bg-[rgba(52,199,89,0.16)] text-[rgb(52,199,89)] border-[rgba(52,199,89,0.25)]"
                            : "bg-black/[0.05] text-black/70 border-black/10";

                        return (
                          <div key={r.id} className="px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-[14px] font-extrabold text-black/90">{r.farmName}</p>

                                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", pill)}>
                                    {r.status === "submitted" ? "Submitted" : "Draft"}
                                  </span>

                                  <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-black/60">
                                    <I.Pin className="h-3.5 w-3.5" />
                                    {count} pt{count === 1 ? "" : "s"}
                                    {typeof r.approxAreaHa === "number" ? ` • ~${r.approxAreaHa.toFixed(2)}ha` : ""}
                                  </span>
                                </div>

                                <p className="mt-1 text-[12px] text-black/55">
                                  {r.city}, {r.lga}, {r.state}
                                </p>

                                <p className="mt-2 text-[12px] text-black/60">
                                  <span className="font-bold text-black/80">{r.contactName}</span> • {r.contactPhone}
                                </p>

                                <div className="mt-2 grid gap-1 text-[11px] text-black/45">
                                  <div>
                                    Created: <span className="font-semibold text-black/70">{r.createdAt}</span>
                                  </div>
                                  <div>
                                    Submitted:{" "}
                                    <span className="font-semibold text-black/70">{r.submittedAt ?? "—"}</span>
                                  </div>
                                </div>
                              </div>

                              <a
                                className={cn(
                                  "flex items-center gap-1 rounded-2xl border border-black/10 bg-white/60 px-3 py-2 text-[12px] font-bold text-black/70 transition hover:bg-white/80",
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
                                View <I.ChevronRight className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </IOSCard>
            </section>
          ) : (
            <section className="pb-6">
              <AnimatePresence mode="wait">
                {/* STEP 0: boundary */}
                {step === 0 ? (
                  <motion.div
                    key="ios_s0"
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4"
                  >
                    {/* Map (hero) */}
                    <IOSCard className="overflow-hidden">
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-extrabold text-black/85">Boundary capture</p>
                          <p className="mt-1 text-[12px] text-black/55">Tap to add points, or use GPS / Auto-walk.</p>
                        </div>

                        <IOSPill
                          className={cn(
                            "px-3",
                            geoState === "ok"
                              ? "border-[rgba(52,199,89,0.25)] bg-[rgba(52,199,89,0.14)] text-[rgb(52,199,89)]"
                              : geoState === "locating"
                              ? "border-[rgba(255,149,0,0.25)] bg-[rgba(255,149,0,0.14)] text-[rgb(255,149,0)]"
                              : geoState === "error"
                              ? "border-[rgba(255,59,48,0.25)] bg-[rgba(255,59,48,0.14)] text-[rgb(255,59,48)]"
                              : ""
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              geoState === "ok"
                                ? "bg-[rgb(52,199,89)]"
                                : geoState === "locating"
                                ? "bg-[rgb(255,149,0)]"
                                : geoState === "error"
                                ? "bg-[rgb(255,59,48)]"
                                : "bg-black/30"
                            )}
                          />
                          {geoState === "idle"
                            ? "GPS idle"
                            : geoState === "locating"
                            ? "Locating…"
                            : geoState === "ok"
                            ? "GPS ready"
                            : "GPS error"}
                        </IOSPill>
                      </div>

                      <div className="relative h-[360px] w-full">
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
                            setMsg("Point added ✅");
                          }}
                          cursor={tapToAdd ? "crosshair" : "grab"}
                        >
                          <div className="absolute left-3 top-3 z-10">
                            <div className="rounded-2xl border border-black/10 bg-white/70 p-1 backdrop-blur-xl">
                              <NavigationControl showZoom showCompass visualizePitch />
                            </div>
                          </div>

                          <div className="absolute right-3 top-3 z-10">
                            <div className="rounded-2xl border border-black/10 bg-white/70 px-2 py-1 backdrop-blur-xl">
                              <select
                                value={mapStyleKey}
                                onChange={(e) => setMapStyleKey(e.target.value as any)}
                                className="h-8 bg-transparent text-[12px] font-bold text-black/70 outline-none"
                              >
                                {MAP_STYLES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {boundary.geojson ? (
                            <Source id="boundary" type="geojson" data={boundary.geojson as any}>
                              <Layer
                                id="boundary-line"
                                type="line"
                                paint={{
                                  "line-color": "rgba(0,122,255,0.9)",
                                  "line-width": 3,
                                }}
                              />
                              {boundary.isPolygon ? (
                                <Layer
                                  id="boundary-fill"
                                  type="fill"
                                  paint={{
                                    "fill-color": "rgba(0,122,255,0.14)",
                                    "fill-outline-color": "rgba(0,122,255,0.35)",
                                  }}
                                />
                              ) : null}
                            </Source>
                          ) : null}

                          {points.map((p, i) => (
                            <Marker key={`${p.capturedAt}_${i}`} latitude={p.lat} longitude={p.lng} anchor="bottom">
                              <div className="grid place-items-center">
                                <div className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/80 text-[12px] font-extrabold text-black/80 shadow-[0_10px_20px_rgba(0,0,0,0.12)] backdrop-blur">
                                  {i + 1}
                                </div>
                                <div className="mt-1 h-3.5 w-3.5 rotate-45 rounded-sm border border-black/10 bg-white/80 shadow-[0_10px_20px_rgba(0,0,0,0.12)] backdrop-blur" />
                              </div>
                            </Marker>
                          ))}
                        </Map>

                        <div className="absolute left-3 bottom-3 z-10">
                          <IOSButton
                            type="button"
                            variant={tapToAdd ? "primary" : "secondary"}
                            onClick={() => setTapToAdd((v) => !v)}
                            className="px-3 py-2 text-[12px]"
                          >
                            {tapToAdd ? "Tap to add: ON" : "Tap to add: OFF"}
                          </IOSButton>
                        </div>
                      </div>

                      <div className="border-t border-black/10 px-4 py-4">
                        <div className="grid grid-cols-3 gap-2">
                          <IOSCard className="rounded-2xl bg-white/70 shadow-none">
                            <div className="px-3 py-2">
                              <p className="text-[11px] font-semibold text-black/45">Points</p>
                              <p className="mt-1 text-[14px] font-extrabold text-black/85">{boundary.count}</p>
                            </div>
                          </IOSCard>

                          <IOSCard className="rounded-2xl bg-white/70 shadow-none">
                            <div className="px-3 py-2">
                              <p className="text-[11px] font-semibold text-black/45">Approx area</p>
                              <p className="mt-1 text-[14px] font-extrabold text-black/85">
                                {boundary.approxAreaHa == null ? "—" : `${boundary.approxAreaHa.toFixed(2)} ha`}
                              </p>
                            </div>
                          </IOSCard>

                          <IOSCard className="rounded-2xl bg-white/70 shadow-none">
                            <div className="px-3 py-2">
                              <p className="text-[11px] font-semibold text-black/45">Centroid</p>
                              <p className="mt-1 truncate font-mono text-[11px] font-bold text-black/70">
                                {formatCoord(boundary.centroid?.lat ?? null)}, {formatCoord(boundary.centroid?.lng ?? null)}
                              </p>
                            </div>
                          </IOSCard>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <IOSButton type="button" variant="secondary" onClick={captureGpsPointOnce}>
                            {geoState === "locating" ? <Spinner /> : <I.Locate className="h-4 w-4" />}
                            GPS point
                          </IOSButton>

                          <IOSButton type="button" variant={tracking ? "primary" : "secondary"} onClick={toggleTrackingWalk}>
                            <I.Walk className="h-4 w-4" />
                            {tracking ? "Stop walk" : "Auto-walk"}
                          </IOSButton>

                          <IOSButton type="button" variant="secondary" onClick={undoLastPoint} disabled={points.length === 0}>
                            <I.Undo className="h-4 w-4" />
                            Undo
                          </IOSButton>

                          <IOSButton type="button" variant="secondary" onClick={clearPoints} disabled={points.length === 0}>
                            <I.Trash className="h-4 w-4" />
                            Clear
                          </IOSButton>
                        </div>

                        <details className="mt-4">
                          <summary className="cursor-pointer list-none text-[13px] font-extrabold text-black/80">
                            Points list <span className="font-semibold text-black/45">({points.length})</span>
                          </summary>

                          {points.length === 0 ? (
                            <p className="mt-2 text-[12px] text-black/55">No points yet.</p>
                          ) : (
                            <div className="mt-3 grid gap-2">
                              {points.map((p, i) => (
                                <div key={`${p.capturedAt}_${i}`} className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[12px] font-extrabold text-black/85">
                                      #{i + 1} • {p.source.toUpperCase()}
                                    </p>
                                    <p className="text-[11px] text-black/45">{p.capturedAt}</p>
                                  </div>
                                  <p className="mt-1 font-mono text-[11px] font-semibold text-black/70">
                                    {formatCoord(p.lat)}, {formatCoord(p.lng)}
                                    {typeof p.accuracyM === "number" ? ` • ±${Math.round(p.accuracyM)}m` : ""}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </details>
                      </div>
                    </IOSCard>

                    <MobileToolbar>
                      <div className="flex items-center gap-2">
                        <IOSButton type="button" variant="secondary" onClick={resetForm}>
                          Reset
                        </IOSButton>
                        <IOSButton type="button" variant="primary" onClick={() => setStep(1)} className="ml-auto">
                          Continue <I.ChevronRight className="h-4 w-4" />
                        </IOSButton>
                      </div>
                    </MobileToolbar>
                  </motion.div>
                ) : null}

                {/* STEP 1: farm */}
                {step === 1 ? (
                  <motion.div
                    key="ios_s1"
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4"
                  >
                    <IOSCard className="overflow-hidden">
                      <div className="px-4 py-4">
                        <p className="text-[14px] font-extrabold text-black/90">Farm profile</p>
                        <p className="mt-1 text-[12px] text-black/55">iOS-style grouped fields for fast entry.</p>

                        {points.length === 0 ? (
                          <div className="mt-3 rounded-2xl border border-[rgba(255,149,0,0.25)] bg-[rgba(255,149,0,0.12)] p-3 text-[12px] font-semibold text-[rgb(255,149,0)]">
                            No boundary points yet. You can continue, but verification may be slower.
                          </div>
                        ) : null}
                      </div>

                      <div className="border-t border-black/10">
                        <div className="divide-y divide-black/10">
                          <IOSFormRow label="Farm name" required>
                            <IOSInput value={farmName} onChange={setFarmName} placeholder="e.g., Green Valley Farm" />
                          </IOSFormRow>

                          <IOSFormRow label="Farm type">
                            <IOSSelect
                              value={farmType}
                              onChange={(v) => setFarmType(v as any)}
                              options={[
                                { value: "crop", label: "Crop" },
                                { value: "livestock", label: "Livestock" },
                                { value: "mixed", label: "Mixed" },
                              ]}
                            />
                          </IOSFormRow>

                          <IOSFormRow label="Size (hectares)">
                            <IOSInput value={sizeHectares} onChange={setSizeHectares} placeholder="e.g., 12.5" inputMode="decimal" />
                          </IOSFormRow>
                        </div>

                        <div className="mt-3 px-4 pb-2">
                          <p className="text-[12px] font-extrabold text-black/70">Location</p>
                        </div>

                        <div className="divide-y divide-black/10">
                          <IOSFormRow label="Address" required>
                            <IOSInput value={address} onChange={setAddress} placeholder="Street / route / area" />
                          </IOSFormRow>
                          <IOSFormRow label="City/Town" required>
                            <IOSInput value={city} onChange={setCity} placeholder="e.g., Ajah" />
                          </IOSFormRow>
                          <IOSFormRow label="LGA" required>
                            <IOSInput value={lga} onChange={setLga} placeholder="e.g., Ibeju-Lekki" />
                          </IOSFormRow>
                          <IOSFormRow label="State" required>
                            <IOSInput value={stateName} onChange={setStateName} placeholder="e.g., Lagos" />
                          </IOSFormRow>
                          <IOSFormRow label="Landmark">
                            <IOSInput value={landmark} onChange={setLandmark} placeholder="Nearby landmark (optional)" />
                          </IOSFormRow>
                        </div>
                      </div>
                    </IOSCard>

                    <MobileToolbar>
                      <div className="flex items-center gap-2">
                        <IOSButton type="button" variant="secondary" onClick={() => setStep(0)}>
                          <I.ChevronLeft className="h-4 w-4" />
                          Back
                        </IOSButton>
                        <IOSButton type="button" variant="primary" onClick={() => setStep(2)} className="ml-auto">
                          Continue <I.ChevronRight className="h-4 w-4" />
                        </IOSButton>
                      </div>
                    </MobileToolbar>
                  </motion.div>
                ) : null}

                {/* STEP 2: contact */}
                {step === 2 ? (
                  <motion.div
                    key="ios_s2"
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4"
                  >
                    <IOSCard className="overflow-hidden">
                      <div className="px-4 py-4">
                        <p className="text-[14px] font-extrabold text-black/90">Farmer / contact</p>
                        <p className="mt-1 text-[12px] text-black/55">Keep it short — like an iOS form.</p>
                      </div>

                      <div className="border-t border-black/10">
                        <div className="divide-y divide-black/10">
                          <IOSFormRow label="Name" required>
                            <IOSInput value={contactName} onChange={setContactName} placeholder="e.g., Amina Bello" />
                          </IOSFormRow>
                          <IOSFormRow label="Role">
                            <IOSInput value={contactRole} onChange={setContactRole} placeholder="Owner / Manager" />
                          </IOSFormRow>
                          <IOSFormRow label="Phone" required>
                            <IOSInput value={contactPhone} onChange={setContactPhone} placeholder="+234 801 234 5678" />
                          </IOSFormRow>
                          <IOSFormRow label="Email">
                            <IOSInput value={contactEmail} onChange={setContactEmail} placeholder="optional@email.com" type="email" />
                          </IOSFormRow>
                          <IOSFormRow label="Main crops/livestock">
                            <IOSInput value={mainCrops} onChange={setMainCrops} placeholder="e.g., tomatoes, pepper, poultry" />
                          </IOSFormRow>
                        </div>

                        <div className="px-4 pt-3 pb-2">
                          <p className="text-[12px] font-extrabold text-black/70">Notes</p>
                        </div>
                        <div className="px-4 pb-4">
                          <IOSTextarea value={notes} onChange={setNotes} placeholder="Any helpful observations…" />
                        </div>
                      </div>
                    </IOSCard>

                    <MobileToolbar>
                      <div className="flex items-center gap-2">
                        <IOSButton type="button" variant="secondary" onClick={() => setStep(1)}>
                          <I.ChevronLeft className="h-4 w-4" />
                          Back
                        </IOSButton>
                        <IOSButton type="button" variant="primary" onClick={() => setStep(3)} className="ml-auto">
                          Review <I.ChevronRight className="h-4 w-4" />
                        </IOSButton>
                      </div>
                    </MobileToolbar>
                  </motion.div>
                ) : null}

                {/* STEP 3: review */}
                {step === 3 ? (
                  <motion.div
                    key="ios_s3"
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4"
                  >
                    <IOSCard className="overflow-hidden">
                      <div className="px-4 py-4">
                        <p className="text-[14px] font-extrabold text-black/90">Review</p>
                        <p className="mt-1 text-[12px] text-black/55">Check details before saving.</p>
                      </div>

                      <div className="border-t border-black/10">
                        <div className="divide-y divide-black/10">
                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[12px] font-semibold text-black/55">Farm</span>
                            <span className="text-[13px] font-extrabold text-black/85">{farmName || "—"}</span>
                          </div>

                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[12px] font-semibold text-black/55">Boundary points</span>
                            <span className="text-[13px] font-extrabold text-black/85">{boundary.count || "—"}</span>
                          </div>

                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[12px] font-semibold text-black/55">Approx area</span>
                            <span className="text-[13px] font-extrabold text-black/85">
                              {boundary.approxAreaHa == null ? "—" : `${boundary.approxAreaHa.toFixed(2)} ha`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[12px] font-semibold text-black/55">Location</span>
                            <span className="text-right text-[12px] font-bold text-black/75">
                              {city || "—"}, {lga || "—"}, {stateName || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[12px] font-semibold text-black/55">Contact</span>
                            <span className="text-right text-[12px] font-bold text-black/75">
                              {contactName || "—"} • {contactPhone || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[12px] font-semibold text-black/55">Centroid</span>
                            <span className="font-mono text-[11px] font-bold text-black/70">
                              {formatCoord(boundary.centroid?.lat ?? null)}, {formatCoord(boundary.centroid?.lng ?? null)}
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const err = validate();
                          return err ? (
                            <div className="px-4 py-4">
                              <div className="rounded-2xl border border-[rgba(255,59,48,0.25)] bg-[rgba(255,59,48,0.12)] p-3 text-[12px] font-semibold text-[rgb(255,59,48)]">
                                {err}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </IOSCard>

                    <MobileToolbar>
                      <div className="flex items-center gap-2">
                        <IOSButton type="button" variant="secondary" onClick={() => setStep(2)}>
                          <I.ChevronLeft className="h-4 w-4" />
                          Back
                        </IOSButton>

                        <IOSButton type="button" variant="secondary" disabled={saving} onClick={onDraft} className="ml-auto">
                          <I.Save className="h-4 w-4" />
                          {saving ? "Saving…" : "Draft"}
                        </IOSButton>

                        <IOSButton type="button" variant="primary" disabled={saving} onClick={onSubmitToManager}>
                          <I.Send className="h-4 w-4" />
                          {saving ? "Submitting…" : "Submit"}
                        </IOSButton>
                      </div>
                    </MobileToolbar>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          )}
        </div>
      </main>
    </AgentLayout>
  );
}