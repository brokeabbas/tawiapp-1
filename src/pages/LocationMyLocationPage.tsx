import React, { useEffect, useMemo, useState } from "react";
import LocationLayout from "../components/location/LocationLayout";
import { cn } from "../components/reusable/atoms";

type VerificationState = "verified" | "pending" | "needs-review";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  state: VerificationState;
  lastUpdated: string;
};

type DocumentItem = {
  id: string;
  name: string;
  type: "PDF" | "IMAGE" | "FORM" | "OTHER";
  status: "approved" | "pending" | "rejected";
  updatedAt: string;
};

type AuditEvent = {
  id: string;
  title: string;
  meta: string;
  by: string;
  severity: "info" | "warn" | "critical";
};

type BoundaryPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type LocationProfile = {
  name: string;
  code: string;
  addressLine: string;
  state: string;
  lga: string;
  ward: string;
  community: string;
  landmark: string;
  lat: number;
  lng: number;
  altitudeM?: number;
  operationalStatus: "Active" | "Paused" | "Inactive";
  verification: VerificationState;
  lastVerifiedAt: string;
  managerName: string;
  managerPhone: string;
  email?: string;
  agentsAssigned: number;
  capturedFarms: number;
  openIssues: number;
};

type DeviceGeo = {
  status: "idle" | "loading" | "ready" | "error";
  lat?: number;
  lng?: number;
  accuracyM?: number;
  timestamp?: number;
  errorMessage?: string;
};

const fmt = {
  coord(n: number, digits = 6) {
    return n.toFixed(digits);
  },
  dateTime(ts: number) {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "—";
    }
  },
};

function buildOsmEmbedUrl(lat: number, lng: number) {
  const delta = 0.01; // ~1km-ish depending on latitude
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
  const marker = `${lat}%2C${lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
}

function buildOsmOpenUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

function buildGoogleDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function statusPillClasses(state: VerificationState) {
  if (state === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function docStatusPill(status: DocumentItem["status"]) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function severityDot(sev: AuditEvent["severity"]) {
  if (sev === "info") return "bg-indigo-500";
  if (sev === "warn") return "bg-amber-500";
  return "bg-rose-500";
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

function downloadGeoJson(profile: LocationProfile, boundary: BoundaryPoint[]) {
  const coords = boundary.map((p) => [p.lng, p.lat]);
  // close polygon if not closed
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) coords.push(first);

  const feature = {
    type: "Feature",
    properties: {
      name: profile.name,
      code: profile.code,
      state: profile.state,
      lga: profile.lga,
      ward: profile.ward,
    },
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };

  const blob = new Blob([JSON.stringify(feature, null, 2)], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profile.code || "location"}-boundary.geojson`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LocationMyLocationPage() {
  const [tab, setTab] = useState<"Profile" | "Compliance" | "Operations" | "Documents" | "Audit">(
    "Profile"
  );
  const [deviceGeo, setDeviceGeo] = useState<DeviceGeo>({ status: "idle" });
  const [toast, setToast] = useState<string | null>(null);

  const profile: LocationProfile = useMemo(
    () => ({
      name: "Tawi Hub — Ibadan",
      code: "TAWI-LOC-OY-IBD-0002",
      addressLine: "Plot 12, Ring Road Industrial Layout, Ibadan",
      state: "Oyo",
      lga: "Ibadan North",
      ward: "Ward 05",
      community: "Ring Road",
      landmark: "Opp. Cocoa House Annex",
      lat: 7.3775,
      lng: 3.947,
      altitudeM: 215,
      operationalStatus: "Active",
      verification: "verified",
      lastVerifiedAt: "2026-02-12 • 14:22",
      managerName: "Location Manager",
      managerPhone: "+234 800 000 0000",
      email: "manager@tawifarms.example",
      agentsAssigned: 9,
      capturedFarms: 312,
      openIssues: 2,
    }),
    []
  );

  const boundary: BoundaryPoint[] = useMemo(
    () => [
      { id: "bp-1", label: "Corner A", lat: 7.37905, lng: 3.9449 },
      { id: "bp-2", label: "Corner B", lat: 7.3792, lng: 3.9491 },
      { id: "bp-3", label: "Corner C", lat: 7.3762, lng: 3.94935 },
      { id: "bp-4", label: "Corner D", lat: 7.37595, lng: 3.94475 },
    ],
    []
  );

  const checklist: ChecklistItem[] = useMemo(
    () => [
      {
        id: "c-1",
        label: "GNSS coordinates captured",
        description: "Latitude/Longitude recorded with acceptable accuracy threshold.",
        state: "verified",
        lastUpdated: "2026-02-12",
      },
      {
        id: "c-2",
        label: "Location photo evidence",
        description: "Entrance + signage photos attached and readable.",
        state: "verified",
        lastUpdated: "2026-02-12",
      },
      {
        id: "c-3",
        label: "Admin boundaries validated",
        description: "State/LGA/Ward matches coordinates and official boundaries.",
        state: "pending",
        lastUpdated: "2026-02-20",
      },
      {
        id: "c-4",
        label: "Boundary points / perimeter",
        description: "Boundary polygon points captured and reviewed for shape consistency.",
        state: "needs-review",
        lastUpdated: "2026-02-23",
      },
      {
        id: "c-5",
        label: "Operational readiness",
        description: "Power, connectivity, staffing and safety checklist completed.",
        state: "verified",
        lastUpdated: "2026-02-10",
      },
    ],
    []
  );

  const documents: DocumentItem[] = useMemo(
    () => [
      { id: "d-1", name: "Site approval form", type: "PDF", status: "approved", updatedAt: "2026-02-12" },
      { id: "d-2", name: "Signage photo (front gate)", type: "IMAGE", status: "approved", updatedAt: "2026-02-12" },
      { id: "d-3", name: "Boundary capture worksheet", type: "FORM", status: "pending", updatedAt: "2026-02-23" },
      { id: "d-4", name: "Connectivity test report", type: "PDF", status: "approved", updatedAt: "2026-02-10" },
    ],
    []
  );

  const audit: AuditEvent[] = useMemo(
    () => [
      { id: "a-1", title: "Location verified (Level 1)", meta: "2026-02-12 • 14:22", by: "Verifier • HQ", severity: "info" },
      { id: "a-2", title: "Boundary points updated", meta: "2026-02-23 • 09:18", by: "Agent Supervisor", severity: "warn" },
      { id: "a-3", title: "Admin boundaries flagged for review", meta: "2026-02-20 • 16:03", by: "Auto-check", severity: "warn" },
      { id: "a-4", title: "Issue raised: delayed check-in trend", meta: "2026-02-28 • 11:40", by: "Ops Monitor", severity: "critical" },
    ],
    []
  );

  const mapLat = deviceGeo.status === "ready" && deviceGeo.lat != null ? deviceGeo.lat : profile.lat;
  const mapLng = deviceGeo.status === "ready" && deviceGeo.lng != null ? deviceGeo.lng : profile.lng;

  const osmEmbedUrl = useMemo(() => buildOsmEmbedUrl(mapLat, mapLng), [mapLat, mapLng]);
  const osmOpenUrl = useMemo(() => buildOsmOpenUrl(mapLat, mapLng), [mapLat, mapLng]);
  const directionsUrl = useMemo(() => buildGoogleDirectionsUrl(mapLat, mapLng), [mapLat, mapLng]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const requestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setDeviceGeo({ status: "error", errorMessage: "Geolocation not supported on this device/browser." });
      return;
    }
    setDeviceGeo({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceGeo({
          status: "ready",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        setDeviceGeo({
          status: "error",
          errorMessage:
            err.message || "Unable to fetch device location. Check permissions and try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10_000 }
    );
  };

  const TabButton = ({ name }: { name: typeof tab }) => (
    <button
      type="button"
      onClick={() => setTab(name)}
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20",
        tab === name
          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
          : "text-zinc-700 hover:bg-zinc-100 border border-transparent"
      )}
    >
      {name}
    </button>
  );

  return (
    <LocationLayout
      title="My Location"
      subtitle="Live position, verification status, compliance evidence, and operational readiness."
    >
      {/* Full-width content area */}
      <main className="w-full px-4 pb-10 sm:px-6 lg:px-10">
        {/* Toast */}
        {toast ? (
          <div className="fixed right-4 top-20 z-50 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-lg">
            {toast}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-12">
          {/* Map + Quick Overview */}
          <section className="xl:col-span-7">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-zinc-900">{profile.name}</h2>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        statusPillClasses(profile.verification)
                      )}
                    >
                      {profile.verification === "verified"
                        ? "Verified"
                        : profile.verification === "pending"
                        ? "Pending"
                        : "Needs review"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {profile.operationalStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {profile.addressLine} • {profile.ward}, {profile.lga}, {profile.state}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Code: <span className="font-medium text-zinc-700">{profile.code}</span> • Last verified:{" "}
                    <span className="font-medium text-zinc-700">{profile.lastVerifiedAt}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={requestDeviceLocation}
                    className={cn(
                      "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition",
                      "hover:bg-zinc-50",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                    )}
                  >
                    {deviceGeo.status === "loading" ? "Getting GPS…" : "Use current GPS"}
                  </button>
                  <a
                    href={osmOpenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition",
                      "hover:bg-zinc-50",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
                    )}
                  >
                    Open map
                  </a>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition",
                      "hover:bg-emerald-700",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                    )}
                  >
                    Directions
                  </a>
                </div>
              </div>

              {/* Map embed */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
                <div className="aspect-[16/9] w-full bg-zinc-50">
                  <iframe
                    title="My location map"
                    src={osmEmbedUrl}
                    className="h-full w-full"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Geo readout */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-600">Reference coordinates (site)</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">
                    {fmt.coord(profile.lat)}, {fmt.coord(profile.lng)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Altitude: {profile.altitudeM != null ? `${profile.altitudeM}m` : "—"} • Landmark:{" "}
                    {profile.landmark}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyToClipboard(`${profile.lat}, ${profile.lng}`);
                        setToast(ok ? "Copied site coordinates" : "Unable to copy");
                      }}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadGeoJson(profile, boundary)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                    >
                      Download GeoJSON
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-600">Device GPS (live)</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">
                    {deviceGeo.status === "ready" && deviceGeo.lat != null && deviceGeo.lng != null
                      ? `${fmt.coord(deviceGeo.lat)}, ${fmt.coord(deviceGeo.lng)}`
                      : "Not captured yet"}
                  </p>

                  {deviceGeo.status === "ready" ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Accuracy: {deviceGeo.accuracyM != null ? `${Math.round(deviceGeo.accuracyM)}m` : "—"} • Updated:{" "}
                      {deviceGeo.timestamp ? fmt.dateTime(deviceGeo.timestamp) : "—"}
                    </p>
                  ) : deviceGeo.status === "error" ? (
                    <p className="mt-1 text-xs text-rose-700">{deviceGeo.errorMessage}</p>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">
                      Use “Use current GPS” to capture your current position for cross-checking.
                    </p>
                  )}

                  <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-600">
                      Cross-check rule: If device GPS differs significantly from site coordinates, raise a review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right rail */}
          <aside className="xl:col-span-5">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
              <h3 className="text-sm font-semibold text-zinc-900">Operational summary</h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
                {[
                  { label: "Agents assigned", value: String(profile.agentsAssigned) },
                  { label: "Captured farms", value: String(profile.capturedFarms) },
                  { label: "Open issues", value: String(profile.openIssues) },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">{s.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-medium text-zinc-900">Primary contact</p>
                <p className="mt-1 text-sm text-zinc-700">{profile.managerName}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{profile.managerPhone}</p>
                {profile.email ? <p className="mt-0.5 text-xs text-zinc-600">{profile.email}</p> : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alert("Hook: call/SMS flow")}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Hook: raise issue flow")}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Raise issue
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Hook: request re-verification flow")}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Request re-verification
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  <TabButton name="Profile" />
                  <TabButton name="Compliance" />
                  <TabButton name="Operations" />
                  <TabButton name="Documents" />
                  <TabButton name="Audit" />
                </div>

                {/* Tab content */}
                <div className="mt-4">
                  {tab === "Profile" ? (
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium text-zinc-900">Administrative boundaries</p>
                        <div className="mt-2 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-zinc-500">State</p>
                            <p className="font-medium">{profile.state}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">LGA</p>
                            <p className="font-medium">{profile.lga}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Ward</p>
                            <p className="font-medium">{profile.ward}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Community</p>
                            <p className="font-medium">{profile.community}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium text-zinc-900">Boundary points (perimeter)</p>
                        <p className="mt-1 text-xs text-zinc-600">
                          Used for verification and geo-consistency checks.
                        </p>

                        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
                          <div className="grid grid-cols-12 gap-2 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                            <div className="col-span-4">Point</div>
                            <div className="col-span-4">Latitude</div>
                            <div className="col-span-4">Longitude</div>
                          </div>
                          <div className="divide-y divide-zinc-200">
                            {boundary.map((p) => (
                              <div key={p.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-zinc-700">
                                <div className="col-span-4 font-medium text-zinc-900">{p.label}</div>
                                <div className="col-span-4">{fmt.coord(p.lat)}</div>
                                <div className="col-span-4">{fmt.coord(p.lng)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => downloadGeoJson(profile, boundary)}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                          >
                            Download GeoJSON
                          </button>
                          <button
                            type="button"
                            onClick={() => alert("Hook: edit boundary capture flow")}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                          >
                            Update boundary
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {tab === "Compliance" ? (
                    <div className="grid gap-3">
                      {checklist.map((c) => (
                        <div key={c.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{c.label}</p>
                              <p className="mt-1 text-xs text-zinc-600">{c.description}</p>
                              <p className="mt-2 text-xs text-zinc-500">Last updated: {c.lastUpdated}</p>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                statusPillClasses(c.state)
                              )}
                            >
                              {c.state === "verified" ? "Verified" : c.state === "pending" ? "Pending" : "Needs review"}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs text-zinc-600">
                          Standard note: Any mismatch between GNSS, admin boundaries, and photo evidence should be escalated
                          for re-verification.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {tab === "Operations" ? (
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium text-zinc-900">Infrastructure checklist</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {[
                            { k: "Power", v: "Stable (backup available)" },
                            { k: "Connectivity", v: "4G LTE • Avg 12–18 Mbps" },
                            { k: "Working hours", v: "Mon–Sat • 8:00–17:00" },
                            { k: "Safety", v: "Fire extinguisher • First aid kit" },
                          ].map((x) => (
                            <div key={x.k} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                              <p className="text-xs text-zinc-600">{x.k}</p>
                              <p className="mt-1 text-sm font-medium text-zinc-900">{x.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium text-zinc-900">Access & logistics</p>
                        <div className="mt-3 grid gap-2">
                          {[
                            "Primary access road is paved; secondary road may flood after heavy rain.",
                            "Nearest fuel station is ~1.8km; nearest police post is ~2.5km.",
                            "Recommended dispatch window: 06:30–07:30 to reduce traffic delays.",
                          ].map((t, idx) => (
                            <div key={idx} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                              <p className="text-sm text-zinc-700">{t}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium text-zinc-900">Risk notes</p>
                        <div className="mt-3 grid gap-2">
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm font-medium text-amber-900">Moderate</p>
                            <p className="mt-1 text-sm text-amber-800">
                              Delayed check-ins observed last week. Consider route optimization and earlier departure.
                            </p>
                          </div>
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                            <p className="text-sm text-zinc-700">
                              Environmental: No known restrictions; confirm seasonal road conditions during peak rains.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {tab === "Documents" ? (
                    <div className="grid gap-3">
                      {documents.map((d) => (
                        <div key={d.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{d.name}</p>
                              <p className="mt-1 text-xs text-zinc-600">
                                Type: {d.type} • Updated: {d.updatedAt}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                docStatusPill(d.status)
                              )}
                            >
                              {d.status}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => alert("Hook: preview document")}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => alert("Hook: replace/upload document")}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => alert("Hook: upload evidence flow")}
                        className={cn(
                          "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition",
                          "hover:bg-emerald-700",
                          "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                        )}
                      >
                        Upload evidence
                      </button>
                    </div>
                  ) : null}

                  {tab === "Audit" ? (
                    <div className="grid gap-3">
                      {audit.map((e) => (
                        <div key={e.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{e.title}</p>
                              <p className="mt-1 text-xs text-zinc-600">{e.meta} • {e.by}</p>
                            </div>
                            <span className={cn("mt-1 inline-flex h-2.5 w-2.5 rounded-full", severityDot(e.severity))} />
                          </div>
                        </div>
                      ))}

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs text-zinc-600">
                          Audit trail is immutable; corrections should be appended as a new event with justification.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </LocationLayout>
  );
}