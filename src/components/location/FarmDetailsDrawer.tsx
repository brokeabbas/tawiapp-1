import React, { useMemo, useState } from "react";
import { cn } from "../reusable/atoms";
import RightDrawer from "./RightDrawer";
import type { CapturedFarm, VerificationState } from "./types";

type Props = {
  open: boolean;
  farm: CapturedFarm | null;
  onClose: () => void;
  onApprove: (farmId: string) => void;
  onReject: (farmId: string) => void;
};

function statusPill(v: VerificationState) {
  if (v === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (v === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function buildOsmEmbedUrl(lat: number, lng: number) {
  const delta = 0.01;
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

// simple placeholder images (hook real ones later)
function svgPlaceholder(label: string) {
  const safe = encodeURIComponent(label);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#eef2ff"/>
        <stop offset="1" stop-color="#ecfdf5"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <rect x="70" y="70" width="1060" height="660" rx="32" fill="#ffffff" opacity="0.88"/>
    <text x="120" y="210" font-size="44" font-family="Inter, system-ui, Arial" fill="#0f172a" font-weight="700">${safe}</text>
    <text x="120" y="275" font-size="24" font-family="Inter, system-ui, Arial" fill="#475569">Evidence placeholder (hook real images from API)</text>
    <g opacity="0.22">
      <circle cx="920" cy="350" r="160" fill="#22c55e"/>
      <circle cx="980" cy="420" r="120" fill="#6366f1"/>
      <circle cx="860" cy="460" r="90" fill="#f59e0b"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FarmDetailsDrawer({ open, farm, onClose, onApprove, onReject }: Props) {
  const [tab, setTab] = useState<"Overview" | "Evidence" | "Map">("Overview");

  const images = useMemo(() => {
    if (!farm) return [];
    if (farm.images && farm.images.length > 0) return farm.images;
    return [
      svgPlaceholder(`${farm.id} • Entrance photo`),
      svgPlaceholder(`${farm.id} • Farmer + plot evidence`),
      svgPlaceholder(`${farm.id} • Signage / landmark`),
    ];
  }, [farm]);

  const mapEmbed = useMemo(() => (farm ? buildOsmEmbedUrl(farm.lat, farm.lng) : ""), [farm]);
  const mapOpen = useMemo(() => (farm ? buildOsmOpenUrl(farm.lat, farm.lng) : "#"), [farm]);
  const directions = useMemo(() => (farm ? buildGoogleDirectionsUrl(farm.lat, farm.lng) : "#"), [farm]);

  const panelWidth = "w-[92vw] sm:w-[440px] lg:w-[32vw] xl:w-[25vw] min-w-[360px] max-w-[520px]";

  if (!farm) {
    return (
      <RightDrawer open={open} onClose={onClose} title="Farm details" subtitle="No selection" widthClassName={panelWidth}>
        <div className="p-5">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-900">Select a farm to view details.</p>
            <p className="mt-1 text-xs text-zinc-600">Click any row in Captured Farms.</p>
          </div>
        </div>
      </RightDrawer>
    );
  }

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={`Farm ${farm.id}`}
      subtitle={`${farm.community} • ${farm.lga}, ${farm.state}`}
      widthClassName={panelWidth}
    >
      {/* pb-24 ensures content doesn't hide behind sticky footer */}
      <div className="p-5 pb-24">
        {/* Summary */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-zinc-900">{farm.farmerName}</p>

                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                    statusPill(farm.verification)
                  )}
                >
                  {farm.verification}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                    farm.issues === 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  )}
                >
                  {farm.issues} issue(s)
                </span>
              </div>

              <p className="mt-1 text-sm text-zinc-700">
                {farm.crop} • {farm.sizeHa.toFixed(2)} ha • {farm.ward}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Captured by <span className="font-medium text-zinc-900">{farm.capturedBy}</span> •{" "}
                <span className="font-medium text-zinc-900">{formatDate(farm.capturedAtIso)}</span>
              </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {(["Overview", "Evidence", "Map"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20",
                    tab === t
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab body */}
        <div className="mt-4 grid gap-4">
          {tab === "Overview" ? (
            <>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-zinc-900">Owner details</p>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Phone</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{farm.farmerPhone}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alert("Hook: call/SMS farmer flow")}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Contact farmer
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Hook: edit owner details")}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Edit details
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-zinc-900">Farm profile</p>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs text-zinc-600">Location</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">
                      {farm.community} • {farm.ward}, {farm.lga}, {farm.state}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {farm.lat.toFixed(6)}, {farm.lng.toFixed(6)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs text-zinc-600">Crop</p>
                      <p className="mt-1 text-sm font-medium text-zinc-900">{farm.crop}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs text-zinc-600">Size</p>
                      <p className="mt-1 text-sm font-medium text-zinc-900">{farm.sizeHa.toFixed(2)} ha</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-zinc-900">Verification notes</p>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs font-medium text-zinc-900">Evidence completeness</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Ensure GPS + photos + capture metadata are consistent and readable.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs font-medium text-zinc-900">Issue summary</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {farm.issues === 0
                        ? "No issues detected."
                        : "Issues detected — review evidence and geo-consistency before approval."}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {tab === "Evidence" ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-zinc-900">Evidence gallery</p>
              <p className="mt-1 text-xs text-zinc-600">
                Review clarity, signage/landmarks, and geo consistency.
              </p>

              <div className="mt-4 grid gap-3">
                {images.map((src, idx) => (
                  <div key={idx} className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                    <img src={src} alt={`Evidence ${idx + 1}`} className="h-44 w-full object-cover" />
                    <div className="border-t border-zinc-200 p-3">
                      <p className="text-xs font-medium text-zinc-900">Evidence {idx + 1}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">Hook: timestamp, GPS tag, uploader</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => alert("Hook: upload/replace evidence")}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Upload evidence
                </button>
                <button
                  type="button"
                  onClick={() => alert("Hook: request recapture from agent")}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  Request recapture
                </button>
              </div>
            </div>
          ) : null}

          {tab === "Map" ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Map & geo review</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Confirm coordinates align with expected community/ward.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={mapOpen}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Open map
                  </a>
                  <a
                    href={directions}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Directions
                  </a>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
                <div className="aspect-[16/10] w-full bg-zinc-50">
                  <iframe title="Farm map" src={mapEmbed} className="h-full w-full" loading="lazy" />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs text-zinc-600">Coordinates</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {farm.lat.toFixed(6)}, {farm.lng.toFixed(6)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky Footer Actions (always within view) */}
      <div className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-600">
            Action: approve to verify, reject to flag for review.
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Approve this farm capture? This will mark it as verified.")) {
                  onApprove(farm.id);
                }
              }}
              className={cn(
                "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition",
                "hover:bg-emerald-700",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
              )}
            >
              Approve
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reject this farm capture? This will flag it for review.")) {
                  onReject(farm.id);
                }
              }}
              className={cn(
                "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition",
                "hover:bg-rose-100",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/20"
              )}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </RightDrawer>
  );
}