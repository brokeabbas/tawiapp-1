// tawifarms\src\components\location\types.ts
export type VerificationState = "verified" | "pending" | "flagged";

export type CapturedFarm = {
  id: string;
  farmerName: string;
  farmerPhone: string;
  crop: string;
  sizeHa: number;
  community: string;
  ward: string;
  lga: string;
  state: string;
  capturedBy: string;
  capturedAtIso: string;
  verification: VerificationState;
  issues: number;
  lat: number;
  lng: number;

  images?: string[];
  notes?: string;
};

export type AgentStatus = "active" | "suspended" | "inactive";

export type LocationAgent = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  status: AgentStatus;

  state: string;
  lga: string;
  ward?: string;

  assignedLocationName: string;
  agentCode: string;

  farmsCapturedTotal: number;
  farmsCapturedThisWeek: number;
  pendingVerifications: number;
  flaggedSubmissions: number;

  lastActiveIso: string;
  lastKnownLat?: number;
  lastKnownLng?: number;
  deviceLabel?: string;

  kycStatus: "verified" | "pending" | "needs-review";
};

export type AgentActivityEvent = {
  id: string;
  title: string;
  meta: string;
  severity: "info" | "warn" | "critical";
};