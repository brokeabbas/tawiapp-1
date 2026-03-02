import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../components/reusable/atoms";
import { AgentLayout } from "../components/agents";

type CaptureStatus = "pending" | "accepted" | "rejected";

type Sample = {
  lat: number;
  lng: number;
  accuracy_m: number;
  ts: number;
};

type SavedCapture = {
  id: string;
  lat: number;
  lng: number;
  accuracy_m: number;
  status: CaptureStatus;
  captured_at: string;
  linked_location_code?: string | null;
  distance_m?: number | null;
};

type LinkedLocation = {
  code: string;
  name: string;
  type: "Farm" | "Warehouse" | "Hub";
  address: string;
  lga: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  notes?: string;
  contact?: { name: string; phone: string };
};

const LS_TAB_KEY = "tawifarms_agent_caploc_tab_v2";
const LS_CAPTURES_KEY = "tawifarms_agent_location_captures_v1";

// Targets (mirrors your reference logic)
const WANT_GOOD_SAMPLES = 8;
const MAX_GOOD_ACCURACY_M = 15;
const MAX_CLUSTER_RADIUS_M = 12;
const CAPTURE_WINDOW_MS = 60_000;
const REPOLL_MS = 6_000;

function nowHuman() {
  const d = new Date();
  return d.toLocaleString();
}

function fmt(n: number, d = 7) {
  return Number.isFinite(n) ? n.toFixed(d) : "—";
}

function meters(n: number) {
  return Number.isFinite(n) ? `${Math.round(n)}m` : "—";
}

function distM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const A =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
}

function pickGood(points: Sample[]) {
  return points.filter((p) => p.accuracy_m > 0 && p.accuracy_m <= MAX_GOOD_ACCURACY_M);
}

function weightedAverage(points: Sample[]) {
  let sumW = 0;
  let sumLat = 0;
  let sumLng = 0;
  let bestAcc = Infinity;

  for (const p of points) {
    const a = Math.max(1, p.accuracy_m || 9999);
    const w = 1 / (a * a);
    sumW += w;
    sumLat += p.lat * w;
    sumLng += p.lng * w;
    if (a < bestAcc) bestAcc = a;
  }

  return { lat: sumLat / sumW, lng: sumLng / sumW, accuracy_m: bestAcc };
}

function clusterRadius(points: Sample[], center: { lat: number; lng: number }) {
  let r = 0;
  for (const p of points) {
    const d = distM(center.lat, center.lng, p.lat, p.lng);
    if (d > r) r = d;
  }
  return r;
}

function loadCaptures(): SavedCapture[] {
  try {
    const raw = localStorage.getItem(LS_CAPTURES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedCapture[]) : [];
  } catch {
    return [];
  }
}

function saveCaptures(list: SavedCapture[]) {
  localStorage.setItem(LS_CAPTURES_KEY, JSON.stringify(list));
}

// --- Demo + Catalog ---------------------------------------------------------

const DEMO_LOCATION: LinkedLocation = {
  code: "0123456789",
  name: "Tawi Farms · Demo Location",
  type: "Farm",
  address: "KM 12, Demo Road, Near Open Sky",
  lga: "Demo LGA",
  state: "Lagos",
  country: "Nigeria",
  // Demo pin (pick any realistic coordinates)
  lat: 6.5243793,
  lng: 3.3792057,
  notes:
    "This is a demo location shown in the Location Details tab. In production, fetch this from your API by linked_location_code.",
  contact: { name: "Demo Supervisor", phone: "+234 800 000 0000" },
};

function getLocationByCode(code?: string | null): LinkedLocation | null {
  if (!code) return null;
  if (code === DEMO_LOCATION.code) return DEMO_LOCATION;
  return null;
}

function jitterAround(lat: number, lng: number, metersRadius = 8) {
  // small random offset around a point in meters
  const r = Math.max(1, metersRadius);
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const dx = w * Math.cos(t);
  const dy = w * Math.sin(t);
  // rough conversion meters->degrees
  const dLat = dy / 111_111;
  const dLng = dx / (111_111 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

// ----------------------------------------------------------------------------

export default function AgentLinkedLocationPage() {
  const [tab, setTab] = useState<"capture" | "details">("capture");
  const [permissionText, setPermissionText] = useState<string>("");

  const [badge, setBadge] = useState<{ text: string; tone: "idle" | "warn" | "good" | "bad" | "locked" }>({
    text: "Idle",
    tone: "idle",
  });

  const [message, setMessage] = useState("Ready when you are.");

  const [captures, setCaptures] = useState<SavedCapture[]>(() => loadCaptures());
  const hasAnyCapture = captures.length > 0; // ✅ one-capture policy
  const activeCapture = captures[0] ?? null;

  // demo mode (auto-enable if not secure context or no geolocation)
  const canUseGeo = typeof navigator !== "undefined" && !!navigator.geolocation;
  const isSecure = typeof window !== "undefined" ? window.isSecureContext : true;
  const [demoMode, setDemoMode] = useState<boolean>(() => !isSecure || !canUseGeo);

  // capture state
  const [isCapturing, setIsCapturing] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [best, setBest] = useState<Sample | null>(null);
  const [finalPoint, setFinalPoint] = useState<Sample | null>(null);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [stableText, setStableText] = useState("—");
  const [goodCount, setGoodCount] = useState(0);

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptHint, setSavePromptHint] = useState("");

  // timers/refs
  const watchIdRef = useRef<number | null>(null);
  const repollRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  // FIX: avoid stale closures inside timers
  const isCapturingRef = useRef(false);
  const bestRef = useRef<Sample | null>(null);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  const tabUI = useMemo(() => {
    return {
      captureCls:
        tab === "capture" ? "text-white bg-indigo-600" : "text-zinc-700 hover:bg-zinc-100",
      detailsCls:
        tab === "details" ? "text-white bg-indigo-600" : "text-zinc-700 hover:bg-zinc-100",
    };
  }, [tab]);

  // persist tab
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_TAB_KEY);
      if (saved === "details") setTab("details");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TAB_KEY, tab);
    } catch {}
  }, [tab]);

  // permissions
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        // @ts-ignore
        if (!navigator.permissions?.query) return;
        // @ts-ignore
        const st = await navigator.permissions.query({ name: "geolocation" });
        if (cancelled) return;
        setPermissionText(`Permission: ${st.state}`);
        st.onchange = () => setPermissionText(`Permission: ${st.state}`);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // lock behavior: if already captured, default to Details
  useEffect(() => {
    if (hasAnyCapture) {
      setTab("details");
      setBadge({ text: "Locked", tone: "locked" });
      setMessage("Capture locked: you already saved a capture. Review it in “Location Details”.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyCapture]);

  function toneClass(tone: typeof badge.tone) {
    if (tone === "good") return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (tone === "warn") return "bg-amber-50 text-amber-800 border-amber-200";
    if (tone === "bad") return "bg-rose-50 text-rose-800 border-rose-200";
    if (tone === "locked") return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
  
  function statusPill(status: CaptureStatus) {
    const cls =
      status === "accepted"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : status === "rejected"
          ? "bg-rose-50 text-rose-800 border-rose-200"
          : "bg-amber-50 text-amber-800 border-amber-200";
  
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold", cls)}>
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    );
  }

  function resetUI() {
    setSamples([]);
    setBest(null);
    setFinalPoint(null);
    setElapsedSec(0);
    setQualityScore(null);
    setStableText("—");
    setGoodCount(0);
    setShowSavePrompt(false);
    setSavePromptHint("");
    setMessage(hasAnyCapture ? "Capture locked: you already saved a capture." : "Ready when you are.");
    setBadge(hasAnyCapture ? { text: "Locked", tone: "locked" } : { text: "Idle", tone: "idle" });
  }

  function stopCaptureInternal() {
    setIsCapturing(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (repollRef.current) window.clearInterval(repollRef.current);
    repollRef.current = null;

    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
  }

  useEffect(() => {
    return () => stopCaptureInternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ingestSample(p: Sample) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || !Number.isFinite(p.accuracy_m) || p.accuracy_m <= 0) return;

    setSamples((prev) => [...prev, p].slice(-30));

    setBest((prevBest) => {
      if (!prevBest || p.accuracy_m < prevBest.accuracy_m) return p;
      return prevBest;
    });
  }

  function onPos(pos: GeolocationPosition) {
    const c = pos.coords;
    const p: Sample = {
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      accuracy_m: Number(c.accuracy || 0),
      ts: pos.timestamp ? Number(pos.timestamp) : Date.now(),
    };
    ingestSample(p);
  }

  function onErr(err: GeolocationPositionError) {
    if (err.code === 1) {
      setBadge({ text: "Denied", tone: "bad" });
      setMessage("Location permission denied. Allow Location + Precise Location, then try again.");
      stopCaptureInternal();
      return;
    }
    if (isCapturingRef.current) {
      if (err.code === 3) {
        setBadge({ text: "Waiting…", tone: "warn" });
        setMessage("Still trying to get a GPS fix…");
        return;
      }
      if (err.code === 2) {
        setBadge({ text: "Searching…", tone: "warn" });
        setMessage("GPS signal not available yet. Move to open sky (or use Demo Mode).");
        return;
      }
    }
    setBadge({ text: "Error", tone: "bad" });
    setMessage(err.message || "Failed to get location.");
  }

  function doGetCurrent(label?: string) {
    if (hasAnyCapture) return;

    if (!navigator.geolocation) {
      setBadge({ text: "Unsupported", tone: "bad" });
      setMessage("This browser does not support Geolocation. Use Demo Mode.");
      return;
    }
    if (label) setMessage(label);

    navigator.geolocation.getCurrentPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 45_000,
    });
  }

  function simulateFix(opts?: { useDemoLocation?: boolean }) {
    if (hasAnyCapture) return;

    const base = opts?.useDemoLocation
      ? { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng }
      : { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng };

    const j = jitterAround(base.lat, base.lng, opts?.useDemoLocation ? 3 : 10);
    const p: Sample = {
      lat: j.lat,
      lng: j.lng,
      accuracy_m: opts?.useDemoLocation ? 6 + Math.random() * 4 : 12 + Math.random() * 20,
      ts: Date.now(),
    };

    setBadge({ text: "Demo fix", tone: "warn" });
    setMessage("Demo Mode: simulated a GPS fix ✅");
    ingestSample(p);
  }

  // recompute quality when samples/best change
  useEffect(() => {
    const good = pickGood(samples);
    setGoodCount(good.length);

    let okCluster = false;

    if (good.length >= 3) {
      const avg = weightedAverage(good);
      const radius = clusterRadius(good, avg);
      okCluster = radius <= MAX_CLUSTER_RADIUS_M;
      setStableText(okCluster ? `Stable (±${Math.round(radius)}m)` : `Unstable (±${Math.round(radius)}m)`);
    } else {
      setStableText(samples.length ? "Collecting…" : "—");
    }

    const bestAcc = best?.accuracy_m ?? 9999;
    const accScore = Math.max(0, Math.min(60, (MAX_GOOD_ACCURACY_M / Math.max(1, bestAcc)) * 60));
    const sampleScore = Math.max(0, Math.min(30, (good.length / WANT_GOOD_SAMPLES) * 30));
    const stableScore = okCluster ? 10 : 0;
    const score = accScore + sampleScore + stableScore;

    setQualityScore(samples.length ? score : null);

    const ready = good.length >= WANT_GOOD_SAMPLES && okCluster;
    if (ready) {
      const avg = weightedAverage(good);
      setFinalPoint({ lat: avg.lat, lng: avg.lng, accuracy_m: avg.accuracy_m, ts: Date.now() });
      setShowSavePrompt(true);
      setSavePromptHint(best ? `best accuracy: ${Math.round(best.accuracy_m)}m` : "");
      if (isCapturingRef.current) {
        setBadge({ text: "You can save", tone: "good" });
        setMessage("✅ Ready to save. Save now or keep going to tighten accuracy.");
      }
    } else {
      if (!isCapturingRef.current && best) setFinalPoint(best);

      if (isCapturingRef.current && best) {
        setBadge({
          text:
            best.accuracy_m <= MAX_GOOD_ACCURACY_M
              ? "Capturing (good)"
              : best.accuracy_m <= 100
                ? "Capturing (weak)"
                : "Capturing (coarse)",
          tone: best.accuracy_m <= MAX_GOOD_ACCURACY_M ? "good" : best.accuracy_m <= 100 ? "warn" : "bad",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples, best]);

  function startCapture() {
    if (hasAnyCapture) return;

    resetUI();

    setIsCapturing(true);
    startedAtRef.current = Date.now();
    setBadge({ text: "Capturing…", tone: "warn" });

    if (demoMode) {
      setMessage("Demo Mode: simulating GPS samples… you can Stop anytime.");
    } else {
      if (!navigator.geolocation) {
        setBadge({ text: "Unsupported", tone: "bad" });
        setMessage("This browser does not support Geolocation. Enable Demo Mode.");
        setIsCapturing(false);
        return;
      }
      setMessage("Warming up GPS… stay steady. You can Stop anytime.");
    }

    // time ticker
    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const secs = Math.min(Math.round(elapsed / 1000), Math.round(CAPTURE_WINDOW_MS / 1000));
      setElapsedSec(secs);
    }, 250);

    // initial fix
    if (demoMode) {
      simulateFix();
      simulateFix();
    } else {
      doGetCurrent();
    }

    // watch / simulate stream
    if (demoMode) {
      repollRef.current = window.setInterval(() => {
        if (!isCapturingRef.current) return;
        // drift gently: some samples good, some mediocre
        const roll = Math.random();
        if (roll < 0.7) simulateFix({ useDemoLocation: true });
        else simulateFix();
      }, REPOLL_MS);
    } else {
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 45_000,
        });
      } catch {
        setBadge({ text: "Error", tone: "bad" });
        setMessage("Unable to start GPS watch.");
        setIsCapturing(false);
        return;
      }

      // repoll (FIXED: uses ref)
      repollRef.current = window.setInterval(() => {
        if (!isCapturingRef.current) return;
        doGetCurrent();
      }, REPOLL_MS);
    }

    // window end
    stopTimerRef.current = window.setTimeout(() => {
      const b = bestRef.current;
      if (!b) return;
      setFinalPoint(b);
      setShowSavePrompt(true);
      setSavePromptHint(b ? `best accuracy: ${Math.round(b.accuracy_m)}m` : "");
      setBadge({ text: "You can save", tone: b.accuracy_m <= MAX_GOOD_ACCURACY_M ? "good" : "warn" });
      setMessage("⏱️ Time window reached. You can save now or keep going for more accuracy.");
    }, CAPTURE_WINDOW_MS);
  }

  function stopCapture() {
    if (hasAnyCapture) return;

    stopCaptureInternal();

    const b = bestRef.current;
    if (b) {
      setFinalPoint(b);
      setShowSavePrompt(true);
      setSavePromptHint(b ? `best accuracy: ${Math.round(b.accuracy_m)}m` : "");
      setBadge({ text: "Stopped", tone: "idle" });
      setMessage(`Capture stopped. You can save now (best: ${Math.round(b.accuracy_m)}m).`);
    } else {
      setBadge({ text: "Stopped", tone: "idle" });
      setMessage("Capture stopped. No location fix received.");
    }
  }

  async function copyCoords() {
    const p = best ?? finalPoint;
    if (!p) return;
    const v = `${fmt(p.lat)},${fmt(p.lng)}`;
    try {
      await navigator.clipboard.writeText(v);
      setMessage("Copied coordinates to clipboard ✅");
      setTimeout(() => setMessage((m) => (m.includes("Copied") ? "Ready when you are." : m)), 900);
    } catch {
      setMessage("Copy failed (browser blocked clipboard).");
    }
  }

  function openMapsHref(p?: { lat: number; lng: number } | null) {
    if (!p) return "#";
    return `https://www.google.com/maps?q=${encodeURIComponent(`${p.lat},${p.lng}`)}`;
  }

  function saveCapture() {
    if (hasAnyCapture) return;
    if (!finalPoint && !best) return;

    const p = finalPoint ?? best!;
    const accepted = p.accuracy_m <= MAX_GOOD_ACCURACY_M;

    // demo linking: if accepted, link to DEMO_LOCATION
    const linkedCode = accepted ? DEMO_LOCATION.code : null;

    const d = accepted
      ? distM(p.lat, p.lng, DEMO_LOCATION.lat, DEMO_LOCATION.lng)
      : null;

    const newCap: SavedCapture = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `cap_${Date.now()}`,
      lat: p.lat,
      lng: p.lng,
      accuracy_m: p.accuracy_m,
      status: accepted ? "accepted" : "pending",
      linked_location_code: linkedCode,
      distance_m: d != null ? Math.round(d) : null,
      captured_at: nowHuman(),
    };

    const next = [newCap, ...captures].slice(0, 20);
    setCaptures(next);
    saveCaptures(next);

    stopCaptureInternal();

    setBadge({ text: accepted ? "Linked" : "Saved", tone: accepted ? "good" : "warn" });
    setMessage(
      accepted
        ? `✅ Saved & Linked. Location: ${linkedCode}`
        : `✅ Saved. Pending auto-link (improve accuracy for faster linking).`
    );

    // lock immediately
    setTimeout(() => {
      setTab("details");
      setBadge({ text: "Locked", tone: "locked" });
      setMessage("Capture locked: you already saved a capture. Review it in “Location Details”.");
    }, 250);
  }

  const timePct = Math.min(100, (elapsedSec / Math.round(CAPTURE_WINDOW_MS / 1000)) * 100);
  const qualityPct = qualityScore == null ? 0 : Math.min(100, Math.max(0, qualityScore));

  const bestPoint = best ?? finalPoint;
  const canSave = !hasAnyCapture && !!(finalPoint || bestPoint);

  const captureMapSrc = bestPoint
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${bestPoint.lat},${bestPoint.lng}`)}&z=18&output=embed`
    : "";

  const linkedLoc = getLocationByCode(activeCapture?.linked_location_code ?? null);

  const linkedMapSrc =
    linkedLoc
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${linkedLoc.lat},${linkedLoc.lng}`)}&z=16&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(`${DEMO_LOCATION.lat},${DEMO_LOCATION.lng}`)}&z=16&output=embed`;

  function statusPill(status: CaptureStatus) {
    const cls =
      status === "accepted"
        ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
        : status === "rejected"
          ? "bg-rose-500/15 text-rose-200 border-rose-400/20"
          : "bg-amber-500/15 text-amber-200 border-amber-400/20";
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold", cls)}>
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    );
  }

  return (
    <AgentLayout title="Capture My Location" subtitle="Capture your current GPS position and auto-link to the closest location (demo-ready).">
      <main className="w-full px-4 py-8 sm:px-6">
        {/* Header + tabs */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Capture My Location</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Capture your current GPS position as an agent. We’ll auto-link you to the{" "}
              <span className="font-semibold">closest location</span> if it’s close-by; otherwise it remains{" "}
              <span className="font-semibold">Pending</span>.
            </p>
          </div>

          <div className="inline-flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
            <button
              type="button"
              onClick={() => setTab("capture")}
              className={cn("px-4 py-2.5 text-sm font-semibold transition", tabUI.captureCls)}
            >
              Agent Geo Capture
            </button>
            <button
              type="button"
              onClick={() => setTab("details")}
              className={cn("px-4 py-2.5 text-sm font-semibold transition", tabUI.detailsCls)}
            >
              Location Details
            </button>
          </div>
        </div>

        <div className="mt-6">
          {/* =========================
              CAPTURE PANEL
             ========================= */}
          {tab === "capture" ? (
            <div className="space-y-6">
              {hasAnyCapture ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <div className="font-semibold">Capture locked</div>
                  <div className="mt-1">
                    You already have a saved capture. Only <span className="font-semibold">one</span> capture is allowed.
                    Switch to <span className="font-semibold">Location Details</span> to review it.
                  </div>
                </div>
              ) : null}

              {/* Top status strip */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft backdrop-blur">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold",
                          toneClass(badge.tone)
                        )}
                      >
                        {badge.text}
                      </span>

                      <span className="text-xs text-zinc-600">{permissionText}</span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700"
                        )}
                      >
                        {demoMode ? "Demo Mode: ON" : "Demo Mode: OFF"}
                      </span>

                      {!isSecure ? (
                        <span className="text-xs text-amber-700">Not HTTPS → demo recommended</span>    
                      ) : null}
                    </div>

                    <div className="mt-2 text-sm text-zinc-600">
                      Target: <span className="font-semibold">≤ 15m accuracy</span> +{" "}
                      <span className="font-semibold">stable cluster</span>. Best on mobile outdoors.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={hasAnyCapture}
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold transition",
                        "text-zinc-900 hover:bg-zinc-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                      )}
                      onClick={() => {
                        setDemoMode((v) => !v);
                        setMessage("Toggled Demo Mode.");
                      }}
                    >
                      Toggle demo
                    </button>

                    <button
                      type="button"
                      disabled={hasAnyCapture}
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold transition",
                        "text-zinc-900 hover:bg-zinc-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                      )}
                      onClick={() => {
                        resetUI();
                        setBadge({ text: "Testing…", tone: "warn" });
                        if (demoMode) simulateFix({ useDemoLocation: true });
                        else doGetCurrent("Requesting a location fix…");
                      }}
                    >
                      Test permission
                    </button>

                    {!hasAnyCapture && demoMode ? (
                      <>
                        <button
                          type="button"
                          disabled={isCapturing}
                          className={cn(
                            "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition",
                            "hover:bg-indigo-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          onClick={() => simulateFix()}
                        >
                          Simulate GPS fix
                        </button>

                        <button
                          type="button"
                          disabled={isCapturing}
                          className={cn(
                            "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition",
                            "hover:bg-indigo-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          onClick={() => simulateFix({ useDemoLocation: true })}
                        >
                          Use demo location
                        </button>
                      </>
                    ) : null}

                    <button
                      type="button"
                      disabled={hasAnyCapture || isCapturing}
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition",
                        "hover:bg-indigo-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/25"
                      )}
                      onClick={startCapture}
                    >
                      Capture my location
                    </button>

                    <button
                      type="button"
                      disabled={hasAnyCapture || !isCapturing}
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold transition",
                        "text-zinc-900 hover:bg-zinc-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                      )}
                      onClick={stopCapture}
                    >
                      Stop
                    </button>

                    <button
                      type="button"
                      disabled={!canSave}
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition",
                        "hover:bg-emerald-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                      )}
                      onClick={saveCapture}
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-600">CAPTURE PROGRESS</div>
                      <div className="text-xs font-semibold text-zinc-900">
                        {elapsedSec}s / {Math.round(CAPTURE_WINDOW_MS / 1000)}s
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${timePct}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">{message}</div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-600">QUALITY</div>
                      <div className="text-xs font-semibold text-zinc-900">
                        Score: {qualityScore == null ? "—" : Math.round(qualityScore)}
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${qualityPct}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">
                      Good samples: <span className="font-semibold">{goodCount}</span> /{" "}
                      <span className="font-semibold">{WANT_GOOD_SAMPLES}</span> · Stability:{" "}
                      <span className="font-semibold">{stableText}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-zinc-600">CURRENT BEST</div>
                    <div className="mt-2 grid gap-1 text-sm text-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Lat</span>
                        <span className="font-mono font-semibold">{bestPoint ? fmt(bestPoint.lat) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Lng</span>
                        <span className="font-mono font-semibold">{bestPoint ? fmt(bestPoint.lng) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Accuracy</span>
                        <span className="font-semibold">{bestPoint ? meters(bestPoint.accuracy_m) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Samples</span>
                        <span className="font-semibold">{samples.length}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={openMapsHref(bestPoint)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition",
                          bestPoint ? "hover:bg-indigo-500" : "pointer-events-none opacity-50"
                        )}
                      >
                        Open in Maps ↗
                      </a>

                      <button
                        type="button"
                        onClick={copyCoords}
                        className={cn(
                          "inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 transition",
                          "hover:bg-zinc-100",
                          !bestPoint && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!bestPoint}
                      >
                        Copy coords
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save prompt */}
                <div
                  className={cn(
                    "mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4",
                    !showSavePrompt && "hidden"
                  )}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-emerald-100">You can save now</div>
                      <div className="mt-1 text-sm text-emerald-200/90">
                        We have a decent GPS lock. Save now, or keep going to improve accuracy.{" "}
                        <span className="ml-1 text-xs text-emerald-200/70">
                          {savePromptHint ? `(${savePromptHint})` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!canSave}
                        className={cn(
                          "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition",
                          "hover:bg-emerald-500",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        onClick={saveCapture}
                      >
                        Save now
                      </button>
                      <button
                        type="button"
                        disabled={hasAnyCapture}
                        className={cn(
                          "inline-flex items-center justify-center rounded-xl border border-emerald-400/20 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition",
                          "hover:bg-emerald-500/10",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        onClick={() => {
                          setShowSavePrompt(false);
                          setMessage("Continuing… hold steady for a tighter cluster.");
                        }}
                      >
                        Keep going
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map + Tips */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">Live Map</div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {demoMode ? "Demo Mode shows a simulated pin." : "Geolocation requires HTTPS + permission."}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600">Tip: outdoors improves accuracy.</div>
                  </div>

                  <div className="mt-4">
                    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                      {bestPoint ? (
                        <iframe title="Live map" src={captureMapSrc} className="h-full w-full" loading="lazy" />
                      ) : (
                        <div className="grid h-full place-items-center p-6 text-center">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">No pin yet</div>
                            <div className="mt-1 text-xs text-zinc-600">
                              Tap <span className="font-semibold">Capture my location</span> (or use Demo Mode).
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft backdrop-blur">
                  <div className="text-sm font-semibold text-zinc-900">Best Practices</div>

                  <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-900">
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-600">
                      <li>
                        Turn on <span className="font-semibold">Location Services / GPS</span>
                      </li>
                      <li>
                        Enable <span className="font-semibold">Precise Location</span> for this app
                      </li>
                      <li>Go outdoors / near a window (avoid thick walls)</li>
                      <li>Hold steady for 10–30 seconds for a clean cluster</li>
                      <li>If dev/testing, toggle <span className="font-semibold">Demo Mode</span></li>
                    </ul>
                  </div>

                  <div className="mt-4 rounded-xl border border-zinc-200 p-4">
                    <div className="text-xs font-semibold text-zinc-600">What we measure</div>
                    <div className="mt-2 text-sm text-zinc-600">
                      We collect multiple samples and prefer a <span className="font-semibold">stable cluster</span>.
                      Better accuracy usually means faster linking.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* =========================
                LOCATION DETAILS PANEL
               ========================= */
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Location Details</div>
                    <div className="mt-1 text-sm text-zinc-600">
                      Breakdown of the location you’re linked to (demo-ready).
                    </div>
                  </div>

                  {/* dev reset */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold transition",
                        "text-zinc-900 hover:bg-zinc-100"
                      )}
                      onClick={() => setTab("capture")}
                    >
                      Go to Capture
                    </button>

                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold transition",
                        "text-zinc-900 hover:bg-zinc-100"
                      )}
                      onClick={() => alert("Hook this to an API refetch in production.")}
                    >
                      Refresh (demo)
                    </button>
                  </div>
                </div>

                {/* Summary strip */}
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-zinc-600">LINK STATUS</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-900">
                        {activeCapture ? "Latest capture" : "No capture yet"}
                      </div>
                      {activeCapture ? statusPill(activeCapture.status) : null}
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">
                      {activeCapture
                        ? `Captured at ${activeCapture.captured_at}`
                        : "Capture your location to see your real linked location. Demo location shown below."}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-zinc-600">CAPTURE SUMMARY</div>
                    <div className="mt-2 grid gap-1 text-sm text-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Lat</span>
                        <span className="font-mono font-semibold">{activeCapture ? fmt(activeCapture.lat) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Lng</span>
                        <span className="font-mono font-semibold">{activeCapture ? fmt(activeCapture.lng) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Accuracy</span>
                        <span className="font-semibold">{activeCapture ? meters(activeCapture.accuracy_m) : "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-zinc-600">LINKED METRICS</div>
                    <div className="mt-2 grid gap-1 text-sm text-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Location Code</span>
                        <span className="font-mono font-semibold">
                          {activeCapture?.linked_location_code ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600">Distance</span>
                        <span className="font-semibold">
                          {activeCapture?.distance_m != null ? meters(activeCapture.distance_m) : "—"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {activeCapture?.status === "accepted"
                          ? "Linked based on proximity + accuracy."
                          : "Pending: improve accuracy to auto-link faster."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
                {/* Linked location breakdown */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {linkedLoc ? "Linked Location" : "Demo Location (preview)"}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {linkedLoc
                          ? "This is the location you were linked to."
                          : "No linked location yet — showing a demo location so the UI is complete."}
                      </div>
                    </div>

                    <a
                      href={openMapsHref(linkedLoc ?? DEMO_LOCATION)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                      )}
                    >
                      Open location ↗
                    </a>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {(() => {
                      const L = linkedLoc ?? DEMO_LOCATION;
                      return (
                        <>
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <div className="text-xs font-semibold text-zinc-600">IDENTITY</div>
                            <div className="mt-2 text-sm font-semibold text-zinc-900">{L.name}</div>
                            <div className="mt-1 text-xs text-zinc-600">
                              <span className="font-semibold">{L.type}</span> · Code{" "}
                              <span className="font-mono font-semibold">{L.code}</span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <div className="text-xs font-semibold text-zinc-600">ADDRESS</div>
                            <div className="mt-2 text-sm text-zinc-900">{L.address}</div>
                            <div className="mt-1 text-xs text-zinc-600">
                              {L.lga}, {L.state} · {L.country}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <div className="text-xs font-semibold text-zinc-600">COORDINATES</div>
                            <div className="mt-2 grid gap-1 text-sm text-zinc-900">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-600">Lat</span>
                                <span className="font-mono font-semibold">{fmt(L.lat)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-600">Lng</span>
                                <span className="font-mono font-semibold">{fmt(L.lng)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <div className="text-xs font-semibold text-zinc-600">CONTACT</div>
                            <div className="mt-2 text-sm text-zinc-900">
                              {L.contact ? (
                                <>
                                  <div className="font-semibold text-zinc-900">{L.contact.name}</div>
                                  <div className="text-xs text-zinc-600">{L.contact.phone}</div>
                                </>
                              ) : (
                                <span className="text-xs text-zinc-600">—</span>
                              )}
                            </div>
                          </div>

                          {L.notes ? (
                            <div className="sm:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                              <div className="text-xs font-semibold text-zinc-600">NOTES</div>
                              <div className="mt-2 text-sm text-zinc-600">{L.notes}</div>
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Map + explanation */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft backdrop-blur">
                  <div className="text-sm font-semibold text-zinc-900">Location Map</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    Showing linked (or demo) location pin.
                  </div>

                  <div className="mt-4 h-[320px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                    <iframe title="Linked location map" src={linkedMapSrc} className="h-full w-full" loading="lazy" />
                  </div>

                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-zinc-600">How linking works</div>
                    <div className="mt-2 text-sm text-zinc-600">
                      In production, you’d compute nearest location from a list of known pins and link when accuracy + proximity are strong.
                      For this demo, we link to{" "}
                      <span className="font-semibold">{DEMO_LOCATION.name}</span> when accuracy is ≤{" "}
                      <span className="font-semibold">{MAX_GOOD_ACCURACY_M}m</span>.
                    </div>
                  </div>

                  {/* optional reset for dev/testing */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cn(
                        "rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold transition",
                        "text-zinc-900 hover:bg-zinc-100"
                      )}
                      onClick={() => {
                        if (!confirm("Clear saved captures? (dev only)")) return;
                        setCaptures([]);
                        saveCaptures([]);
                        resetUI();
                        setTab("capture");
                      }}
                    >
                      Clear capture (dev)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </AgentLayout>
  );
}