// @ts-nocheck
// Mock API client for the integrated Referral super-app.
// Re-exports schema enums/types AND provides client-side mock implementations
// of every React Query hook the original app calls. This lets the entire
// Replit Referral-Quest app run inside Lovable without a backend.

import { useEffect, useState } from "react";

export * from "./schemas";

import {
  ReferrerProfileLevel,
  ReferrerProfilePersona,
  type ReferrerProfile,
  type ReferrerDashboard,
  type LeaderboardEntry,
  type Referral,
  type Badge as BadgeT,
  type Property,
  type PropertyDetail,
  type PropertiesListResponse,
  type ManagerStats,
  type Team,
  type TeamDetail,
  type TeamLeaderboardEntry,
  type Challenge,
  type Notification,
  type AreaStat,
  type PayoutMethod,
  type EarningsDataPoint,
  type CreatePropertyBody,
  type RegisterReferrerBody,
  type SubmitReferralBody,
  type AddReviewBody,
  type SetPayoutMethodBody,
  type Lead,
  type LeadDetail,
  type LeadNote,
  type LeadsListResponse,
  type AnalyticsSummary,
  type Agent,
} from "./schemas";
import { PGS } from "@/referral-app/data/pgs-seed";
import { OWNERS_SEED } from "@/referral-app/data/owners-seed";
import { getMergedProperty } from "@/referral-app/lib/owners-store";
import type { PG } from "@/referral-app/data/pg-types";

// ───────────────── shared helpers ─────────────────
export function setBaseUrl(_url: string) {}
export function setAuthTokenGetter(_getter: () => string | null | Promise<string | null>) {}
export type AuthTokenGetter = () => string | null | Promise<string | null>;

const now = () => new Date().toISOString();
const r = (n: number) => Math.floor(Math.random() * n);

function useAsyncMock<T>(value: T, delay = 200): any {
  return { data: value, isLoading: false, isError: false, error: null, refetch: async () => ({ data: value }) } as any;
}

function makeMutation<TArgs = any, TRes = any>(impl?: (args: TArgs) => TRes | Promise<TRes>) {
  const [isPending, setPending] = useState(false);
  const [data, setData] = useState<TRes | undefined>(undefined);
  const [isSuccess, setSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const mutateAsync = async (args: TArgs) => {
    setPending(true);
    try {
      const res = (impl ? await impl(args) : ({ success: true } as any)) as TRes;
      setData(res); setSuccess(true); return res;
    } catch (e) { setError(e); throw e; }
    finally { setPending(false); }
  };
  const mutate = (args: TArgs, opts?: { onSuccess?: (d: TRes) => void; onError?: (e: unknown) => void }) => {
    mutateAsync(args).then((d) => opts?.onSuccess?.(d)).catch((e) => opts?.onError?.(e));
  };
  return { mutate, mutateAsync, isPending, isSuccess, isError: !!error, error, data, reset: () => { setData(undefined); setSuccess(false); setError(null); } };
}
function useMutationMock<TArgs = any, TRes = any>(impl?: (args: TArgs) => TRes | Promise<TRes>) {
  return makeMutation<TArgs, TRes>(impl);
}

// ───────────────── mock data factories ─────────────────
function mockReferrer(id = 1): ReferrerProfile {
  return {
    id, name: "You",
    phone: "+91 90000 00000",
    referralCode: "GHAR-YOU1",
    persona: ReferrerProfilePersona.EARNER,
    totalEarned: 8450, pendingEarnings: 1250, paidEarnings: 7200,
    xp: 480, level: ReferrerProfileLevel.HUSTLER,
    totalReferrals: 14, verifiedReferrals: 9, bookedReferrals: 4,
    streak: 6, teamId: null, teamName: null, upiId: null,
    createdAt: now(),
  };
}

const NAMES = ["Aarav", "Pooja", "Ravi", "Sneha", "Karthik", "Megha", "Vikram", "Anita", "Lokesh", "Shankar", "Priya", "Rohit", "Divya", "Manish", "Neha"];
const PERSONAS = Object.values(ReferrerProfilePersona);
const LEVELS = Object.values(ReferrerProfileLevel);
const AREAS = ["Koramangala", "HSR Layout", "Bellandur", "Marathahalli", "Whitefield", "Indiranagar", "BTM Layout", "Hebbal", "Electronic City", "Jayanagar"];

function mockLeaderboard(limit = 50): LeaderboardEntry[] {
  return Array.from({ length: limit }).map((_, i) => ({
    rank: i + 1,
    referrerId: i + 1,
    name: `${NAMES[i % NAMES.length]} ${String.fromCharCode(65 + (i % 26))}.`,
    persona: PERSONAS[i % PERSONAS.length] as any,
    level: LEVELS[Math.min(LEVELS.length - 1, Math.floor((limit - i) / 10))] as any,
    xp: Math.max(50, (limit - i) * 60 + r(40)),
    totalEarned: Math.max(500, (limit - i) * 350 + r(200)),
    bookedReferrals: Math.max(0, Math.floor((limit - i) / 3)),
    streak: r(15),
    teamName: i % 4 === 0 ? "Bangalore Hustlers" : null,
  }));
}

function mockProperty(id: number): Property {
  const area = AREAS[id % AREAS.length];
  const rent = 8000 + (id % 6) * 1500;
  const rating = 3.5 + (id % 5) * 0.3;
  const reviews = 5 + (id % 30);
  return {
    id, name: `${area} Comfort PG ${id}`,
    area, address: `${id} Main Rd, ${area}`,
    landmark: `Near ${area} Metro`,
    nearbyMetro: `${area} Metro`,
    pincode: "560000",
    gender: (["MALE", "FEMALE", "ANY"] as const)[id % 3] as any,
    rent,
    monthlyRent: rent,
    deposit: 15000 + (id % 4) * 5000,
    totalRooms: 20 + (id % 10),
    availableRooms: 1 + (id % 8),
    amenities: ["WiFi", "Meals", "Laundry", "AC", "CCTV"].slice(0, 3 + (id % 3)),
    images: [],
    rating,
    avgRating: rating,
    reviewCount: reviews,
    totalReviews: reviews,
    isVerified: id % 3 !== 0,
    referralBonus: (id % 4) * 250,
    description: `Comfortable, well-maintained PG in the heart of ${area}. Walking distance to metro, tech parks and food spots.`,
    availability: "AVAILABLE" as any,
    managerId: 1, managerName: "Rohan",
    managerPhone: "+91 90000 00001",
    createdAt: now(), updatedAt: now(),
  } as any;
}
const ALL_PROPERTIES: Property[] = Array.from({ length: 24 }).map((_, i) => mockProperty(i + 1));

const PROPERTY_ID_LOOKUP = new Map<string, number>(PGS.map((pg, index) => [pg.id, index + 1]));
const OWNER_BY_PG_ID = new Map(
  OWNERS_SEED.flatMap((owner) => owner.propertyIds.map((propertyId) => [propertyId, owner] as const))
);

function toPropertyGender(gender?: string): Property["gender"] {
  if (gender === "Boys") return "MALE" as any;
  if (gender === "Girls") return "FEMALE" as any;
  return "ANY" as any;
}

function getRoomCount(pg?: PG) {
  const text = `${pg?.rooms || ""} ${pg?.lows || ""}`;
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 12;
}

function inferAvailableRooms(pg?: PG) {
  const prices = [pg?.prices?.single, pg?.prices?.double, pg?.prices?.triple].filter((v) => Number(v) > 0);
  return Math.max(1, Math.min(6, prices.length || 1));
}

function numericDeposit(value?: string) {
  if (!value) return 0;
  const lower = value.toLowerCase();
  if (lower.includes("one month")) return 15000;
  if (lower.includes("two month")) return 30000;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function getPropertyRating(pg?: PG) {
  if (!pg?.iq) return null;
  return Number((3.6 + (Math.min(pg.iq, 100) / 100) * 1.3).toFixed(1));
}

function mapPgToProperty(pg: PG, options?: { overrideId?: number }): Property {
  const owner = OWNER_BY_PG_ID.get(pg.id);
  const id = options?.overrideId ?? PROPERTY_ID_LOOKUP.get(pg.id) ?? 0;
  const totalRooms = getRoomCount(pg);
  const availableRooms = inferAvailableRooms(pg);
  const avgRating = getPropertyRating(pg);

  return {
    id,
    managerId: id,
    name: pg.name,
    description: pg.vibe || pg.usp || `Managed living option in ${pg.area}`,
    address: pg.locality || pg.area,
    area: pg.area,
    city: "Bangalore",
    pincode: "560000",
    monthlyRent: pg.prices?.min || pg.prices?.single || pg.prices?.double || pg.prices?.triple || 0,
    deposit: numericDeposit(pg.deposit),
    gender: toPropertyGender(pg.gender),
    totalRooms,
    availableRooms,
    amenities: [...(pg.amenities || []), ...(pg.safety || [])].slice(0, 8),
    photos: [],
    availability: availableRooms > 0 ? ("AVAILABLE" as any) : ("FULL" as any),
    isVerified: (pg.iq || 0) >= 70,
    avgRating,
    totalReviews: avgRating ? 8 + (id % 19) : 0,
    referralBonus: (id % 4) * 250,
    nearbyMetro: pg.landmarksInline?.[0] || null,
    nearbyLandmark: pg.landmarksInline?.[1] || null,
    managerName: owner?.name || pg.manager?.name || null,
    managerPhone: owner?.phone || pg.manager?.phone || null,
    createdAt: now(),
    updatedAt: now(),
  } as any;
}

function getAllSeedProperties(): Property[] {
  return PGS.map((pg, index) => mapPgToProperty(getMergedProperty(pg.id) || pg, { overrideId: index + 1 }));
}

function getSeedPropertyByNumericId(id?: number | string) {
  const numId = Number(id || 0);
  return getAllSeedProperties().find((property) => property.id === numId);
}

function mockArea(name: string, idx: number): AreaStat {
  return {
    name, slug: name.toLowerCase().replace(/\s+/g, "-"),
    propertyCount: 8 + idx,
    avgRent: 9000 + idx * 800,
    minRent: 6000, maxRent: 18000,
    availableRooms: 3 + idx,
    leadCount: 12 + idx * 4,
  } as any;
}

function mockTeam(id: number): Team {
  return {
    id, name: ["Bangalore Hustlers", "Koramangala Crew", "ORR Champions", "Whitefield Warriors"][id % 4],
    description: "Top-performing referral team in Bengaluru.",
    captainId: 1, captainName: "Aarav S.",
    inviteCode: `JOIN-${id}${r(900) + 100}`,
    memberCount: 8 + r(20),
    totalXp: 2000 + r(8000),
    totalEarned: 25000 + r(80000),
    totalBookings: 12 + r(40),
    createdAt: now(),
  };
}

function mockChallenge(id: number): Challenge {
  return {
    id, type: (["DAILY", "WEEKLY", "MONTHLY", "SPECIAL"] as const)[id % 4] as any,
    title: ["Refer 1 today", "Verify 3 this week", "Hit 5 bookings", "Streak of 7"][id % 4],
    description: "Push your hustle and rack up XP.",
    xpReward: 50 + id * 25,
    cashReward: id % 2 ? 100 : 0,
    target: 1 + (id % 5),
    progress: r(2 + (id % 5)),
    completed: false,
    expiresAt: new Date(Date.now() + 86400000 * (1 + id)).toISOString(),
  } as any;
}

function mockNotification(id: number): Notification {
  return {
    id,
    type: (["LEAD_VERIFIED", "PAYOUT", "BADGE", "CHALLENGE", "SYSTEM"] as const)[id % 5] as any,
    title: ["Lead verified!", "Payout sent", "New badge", "Challenge ready", "Welcome!"][id % 5],
    message: "You're on a roll. Keep it up.",
    read: id > 2,
    createdAt: new Date(Date.now() - id * 3600000).toISOString(),
  } as any;
}

function mockReferral(id: number): Referral {
  return {
    id, referralId: `REF-${1000 + id}`,
    referrerId: 1, referrerName: "You",
    leadName: NAMES[id % NAMES.length],
    leadPhone: `+91 9${String(100000000 + id * 17).slice(0, 9)}`,
    moveInTimeline: (["IMMEDIATE", "WITHIN_WEEK", "WITHIN_MONTH", "EXPLORING"] as const)[id % 4] as any,
    area: AREAS[id % AREAS.length],
    status: (["NEW", "CONTACTED", "VERIFIED", "MATCHED", "VISIT", "BOOKED", "CLOSED", "LOST"] as const)[id % 8] as any,
    source: "DIRECT" as any,
    isDuplicate: false,
    xpEarned: 10 + id * 5,
    createdAt: new Date(Date.now() - id * 86400000).toISOString(),
    updatedAt: now(),
  };
}

export const GHARPAYY_AGENTS: Agent[] = [
  { id: 1, name: "Aditi · HSR Expert", phone: "+91 90000 11111", activeLeads: 8, totalClosed: 42 },
  { id: 2, name: "Rahul · Koramangala Expert", phone: "+91 90000 22222", activeLeads: 11, totalClosed: 37 },
  { id: 3, name: "Meera · PG Desk", phone: "+91 90000 33333", activeLeads: 6, totalClosed: 29 },
  { id: 4, name: "Imran · Flats Desk", phone: "+91 90000 44444", activeLeads: 5, totalClosed: 31 },
];

const LEADS_KEY = "gharpayy_referral_leads_v2";
const NOTES_KEY = "gharpayy_referral_notes_v2";

function canStore() { return typeof window !== "undefined" && !!window.localStorage; }
function toLead(ref: any): Lead {
  const agent = GHARPAYY_AGENTS.find((a) => a.id === ref.assignedAgentId);
  // derive zone + tier from area / persona / explicit fields · kept lazy so
  // the API file stays self-contained for tests.
  let zoneId: string | null = ref.zoneId || null;
  let tier: string | null = ref.tier || null;
  try {
    if (!zoneId && ref.area) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { zoneForArea } = require("@/lib/gharpayy-zones");
      zoneId = zoneForArea(String(ref.area).toLowerCase().replace(/\s+/g, "-"))?.slug || null;
    }
    if (!tier) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { tierForRent, tierForBudget } = require("@/lib/pricing-tiers");
      if (ref.monthlyRent) tier = tierForRent(ref.monthlyRent).id;
      else if (ref.budget) tier = tierForBudget(ref.budget);
      else tier = "CLASSICS";
    }
  } catch {}
  return {
    ...ref,
    leadPhone: ref.leadPhone || "+91 90000 00000",
    moveInTimeline: ref.moveInTimeline || "WITHIN_WEEK",
    area: ref.area ?? null,
    status: ref.status || "NEW",
    source: ref.source || ref.propertyType || "REFER_AND_EARN",
    referrerName: ref.referrerName ?? "You",
    assignedAgentName: ref.assignedAgentName ?? agent?.name ?? null,
    captainId: ref.captainId ?? null,
    captainName: ref.captainName ?? null,
    personaId: ref.personaId ?? null,
    propertyType: ref.propertyType ?? null,
    sourceContext: ref.sourceContext ?? null,
    zoneId,
    tier,
    channel: ref.channel || "wa-share",
    referrerCode: ref.referrerCode || "GHAR-YOU1",
    isDuplicate: !!ref.isDuplicate,
    createdAt: ref.createdAt || now(),
    updatedAt: ref.updatedAt || now(),
  } as any;
}
function seedLeads(): Lead[] {
  return Array.from({ length: 18 }).map((_, i) => {
    const lead = toLead(mockReferral(i + 1));
    lead.assignedAgentName = i % 3 === 0 ? GHARPAYY_AGENTS[i % GHARPAYY_AGENTS.length].name : null;
    (lead as any).assignedAgentId = i % 3 === 0 ? GHARPAYY_AGENTS[i % GHARPAYY_AGENTS.length].id : null;
    return lead;
  });
}
function getStoredLeads(): Lead[] {
  if (!canStore()) return seedLeads();
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    if (raw) return JSON.parse(raw).map(toLead);
    const seeded = seedLeads();
    localStorage.setItem(LEADS_KEY, JSON.stringify(seeded));
    return seeded;
  } catch { return seedLeads(); }
}
function saveLeads(leads: Lead[]) {
  if (!canStore()) return;
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads.map(toLead)));
}
function getNotes(): Record<string, LeadNote[]> {
  if (!canStore()) return {};
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}"); } catch { return {}; }
}
function saveNotes(notes: Record<string, LeadNote[]>) {
  if (!canStore()) return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
function upsertLead(next: Lead) {
  const leads = getStoredLeads();
  const idx = leads.findIndex((l) => l.id === next.id || l.referralId === next.referralId);
  if (idx >= 0) leads[idx] = toLead({ ...leads[idx], ...next, updatedAt: now() });
  else leads.unshift(toLead(next));
  saveLeads(leads);
  return toLead(idx >= 0 ? leads[idx] : next);
}
function getLeadNotes(leadId: number): LeadNote[] {
  const notes = getNotes()[String(leadId)];
  if (notes?.length) return notes;
  return [{ id: 1, leadId, note: "Lead captured from Refer & Earn and ready for assignment.", type: "NOTE" as any, createdByName: "System", createdAt: now() }];
}
function addLeadNote(leadId: number, note: string, type: string, agentName = "Admin User") {
  const all = getNotes();
  const list = all[String(leadId)] || getLeadNotes(leadId);
  const entry = { id: Date.now(), leadId, note, type, createdByName: agentName, createdAt: now() } as any;
  all[String(leadId)] = [entry, ...list];
  saveNotes(all);
  return entry;
}

// ───────────────── Referrer hooks ─────────────────
export function useGetReferrerDashboard(_id?: number) {
  const referrer = mockReferrer();
  const dashboard: ReferrerDashboard = {
    referrer,
    badges: [
      { id: "first-home", name: "First Home", description: "First referral submitted", icon: "🏠", earnedAt: now() },
      { id: "money", name: "Money Maker", description: "First ₹500 earned", icon: "💰", earnedAt: now() },
    ] as BadgeT[],
    nextLevelXp: 700, currentLevelXp: 300,
    recentActivity: Array.from({ length: 6 }).map((_, i) => ({
      id: i + 1,
      type: (["REFERRAL_SUBMITTED", "LEAD_VERIFIED", "LEAD_BOOKED", "BADGE_EARNED"] as const)[i % 4] as any,
      description: ["Submitted a lead for HSR", "Lead Sneha verified", "Booking confirmed in Koramangala", "Earned Money Maker badge"][i % 4],
      amount: i % 3 === 0 ? 250 : null,
      xpGained: 20 + i * 5,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    })),
    rank: 7, teamRank: 3, unreadNotifications: 2, activeChallenges: 4,
  };
  return useAsyncMock(dashboard);
}
export function useGetReferrerEarningsChart(_id?: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const data: EarningsDataPoint[] = months.map((m, i) => ({
    month: m, year: 2025, earned: 800 + i * 600 + r(400),
    referrals: 2 + i, bookings: i,
  }));
  return useAsyncMock(data);
}
export function useGetReferrerReferrals(_id?: number) {
  return useAsyncMock(getStoredLeads().filter((lead: any) => !lead.referrerId || lead.referrerId === _id).slice(0, 20));
}
export function useGetReferrerByCode(code?: string) {
  const ref = mockReferrer();
  ref.referralCode = code || ref.referralCode;
  return useAsyncMock({ referrer: ref, badges: [] as BadgeT[], rank: 7 });
}
export function useRegisterReferrer() {
  return useMutationMock<{ data: RegisterReferrerBody }, ReferrerProfile>(({ data }) => {
    const ref = mockReferrer();
    ref.name = data.name; ref.phone = data.phone; ref.persona = data.persona as any;
    ref.referralCode = `${(data.name || "GHAR").slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return ref;
  });
}
export function useSubmitReferral() {
  return useMutationMock<{ data: SubmitReferralBody }, any>((args) => {
    const id = Date.now();
    const inData: any = args.data || {};
    // Resolve expert from explicit captainId, or fall back to area-based legacy agent.
    let expert: any = null;
    let captainName: string | null = null;
    try {
      // Lazy require to keep this file self-contained for tests.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { CAPTAIN_BY_ID, captainForArea, captainForPersona } = require("@/lib/captains");
      expert =
        (inData.captainId && CAPTAIN_BY_ID[inData.captainId]) ||
        (inData.personaId ? captainForPersona(inData.personaId) : null) ||
        (inData.area ? captainForArea(inData.area) : null) ||
        null;
      captainName = expert?.name || null;
    } catch {}
    const legacyAgent = GHARPAYY_AGENTS[(inData.area || "").length % GHARPAYY_AGENTS.length];
    const ref = toLead({
      ...mockReferral(id % 9000),
      id,
      referralId: `GHAR-${String(id).slice(-6)}`,
      leadName: inData.leadName,
      leadPhone: inData.leadPhone,
      area: inData.area || null,
      moveInTimeline: inData.moveInTimeline as any,
      status: "NEW",
      source: "REFER_AND_EARN",
      propertyType: inData.propertyType || "PG",
      personaId: inData.personaId || null,
      captainId: inData.captainId || expert?.id || null,
      captainName,
      sourceContext: inData.sourceContext || null,
      referrerId: inData.referrerId || 1,
      referrerName: inData.referrerName || "Referral user",
      referrerPhone: inData.referrerPhone || null,
      assignedAgentId: legacyAgent.id,
      assignedAgentName: captainName ? `${captainName} · expert` : legacyAgent.name,
    });
    const saved = upsertLead(ref);
    addLeadNote(
      saved.id,
      captainName
        ? `Routed to ${captainName} via ${inData.sourceContext || "super-app"}.`
        : `Assigned automatically to ${legacyAgent.name}.`,
      "STATUS_CHANGE",
      "Routing Bot",
    );
    return { ...saved, referral: saved, referralId: saved.referralId, leadName: saved.leadName };
  });
}
export function useCalculateEarnings(input?: { referrals?: number; referralsPerMonth?: number; verifyRate?: number; bookRate?: number }) {
  const refs = (input?.referrals ?? input?.referralsPerMonth ?? 10);
  const verifyRate = input?.verifyRate ?? 0.7;
  const bookRate = input?.bookRate ?? 0.3;
  const verified = Math.round(refs * verifyRate);
  const booked = Math.round(verified * bookRate);
  const totalEarnings = verified * 50 + booked * 500;
  const monthlyProjection = totalEarnings * 4;
  const annual = monthlyProjection * 12;
  const xp = verified * 10 + booked * 50;
  const estimatedLevel = monthlyProjection > 20000 ? "LEGEND" : monthlyProjection > 8000 ? "PRO" : monthlyProjection > 3000 ? "HUSTLER" : monthlyProjection > 800 ? "EXPLORER" : "BEGINNER";
  const data = { totalEarnings, monthlyProjection, annual, verified, booked, verifiedCount: verified, bookedCount: booked, monthly: totalEarnings, xp, estimatedLevel };
  return { data, isLoading: false, isError: false, error: null, refetch: async () => ({ data }) } as any;
}

// ───────────────── Leaderboard / Areas ─────────────────
export function useGetLeaderboard(opts?: { limit?: number; persona?: string }) {
  return useAsyncMock(mockLeaderboard(opts?.limit ?? 50));
}
export function useGetAreas() {
  return useAsyncMock(AREAS.map((a, i) => mockArea(a, i)));
}

// ───────────────── Properties ─────────────────
export function useGetProperties(filters?: { area?: string; gender?: string; maxPrice?: number; amenities?: string[]; metro?: boolean }) {
  let list = getAllSeedProperties();
  if (filters?.area) list = list.filter((p) => p.area === filters.area);
  if (filters?.gender) list = list.filter((p) => (p as any).gender === filters.gender);
  if (filters?.maxPrice) list = list.filter((p) => ((p as any).monthlyRent ?? (p as any).rent) <= filters.maxPrice!);
  const res: PropertiesListResponse = { properties: list, total: list.length } as any;
  return useAsyncMock(res);
}
export function useGetProperty(id?: number | string) {
  const p = getSeedPropertyByNumericId(id);
  if (!p) return useAsyncMock(undefined as any);
  const detail: PropertyDetail = {
    property: p,
    reviews: Array.from({ length: 4 }).map((_, i) => ({
      id: i + 1, propertyId: p.id, reviewerName: NAMES[i % NAMES.length], userName: NAMES[i % NAMES.length],
      rating: 4 + (i % 2), comment: "Clean place, helpful staff. Good food.",
      stayDuration: i % 2 ? "3 months" : "6 months",
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    })) as any,
    nearbyProperties: getAllSeedProperties().filter((x) => x.id !== p.id && x.area === p.area).slice(0, 4),
  } as any;
  return useAsyncMock(detail);
}
export function useAddPropertyReview() {
  return useMutationMock<{ propertyId: number; data: AddReviewBody }, { success: true }>(() => ({ success: true }));
}
export function useAddRealOwnerProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data: any }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add property");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "properties"] });
    }
  });
}
export function useCreateProperty() {
  return useMutationMock<{ data: CreatePropertyBody }, Property>(({ data }) => ({ ...mockProperty(getAllSeedProperties().length + 1), ...(data as any) }) as any);
}
export function useGetManagerStats(adminId?: number, activeOwnerId?: string | null) {
  return useQuery({
    queryKey: ["admin", "stats", adminId, activeOwnerId],
    queryFn: async () => {
      const url = new URL(`${getBackendUrl()}/api/stats/admin`);
      if (activeOwnerId) url.searchParams.set("ownerId", activeOwnerId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return await res.json();
    }
  });
}
export function useGetManagerProperties(adminId?: number, activeOwnerId?: string | null) {
  return useQuery({
    queryKey: ["admin", "properties", adminId, activeOwnerId],
    queryFn: async () => {
      const url = new URL(`${getBackendUrl()}/api/admin/properties`);
      if (activeOwnerId) url.searchParams.set("ownerId", activeOwnerId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch admin properties");
      return await res.json();
    }
  });
}
export function useGetAdminNotifications() {
  return useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const res = await fetch(`${getBackendUrl()}/api/admin/notifications`);
      if (!res.ok) throw new Error("Failed to fetch admin notifications");
      return await res.json();
    },
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
  });
}
export function useGetAdminOwners() {
  return useQuery({
    queryKey: ["admin", "owners"],
    queryFn: async () => {
      const res = await fetch(`${getBackendUrl()}/api/admin/owners`);
      if (!res.ok) throw new Error("Failed to fetch admin owners");
      return await res.json();
    }
  });
}
export function useGetAdminRooms(activeOwnerId?: string | null) {
  return useQuery({
    queryKey: ["admin", "rooms", activeOwnerId],
    queryFn: async () => {
      if (!activeOwnerId) return { rooms: [], roomStatuses: [], roomMedia: [] };
      const res = await fetch(`${getBackendUrl()}/api/admin/rooms?ownerId=${activeOwnerId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch admin rooms");
      return data.data;
    },
    enabled: !!activeOwnerId,
  });
}
export function useRotateAdminOwnerPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getBackendUrl()}/api/admin/owners/${id}/rotate-password`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to rotate password");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "owners"] });
    }
  });
}
export function useMarkAdminNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${getBackendUrl()}/api/admin/notifications/mark-read`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to mark read");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    }
  });
}
export function useUpdatePropertyAvailability() {
  return useMutationMock<{ propertyId: number; data: { availability: string } }>();
}

// ───────────────── Teams ─────────────────
export function useGetTeams() {
  return useAsyncMock(Array.from({ length: 6 }).map((_, i) => mockTeam(i + 1)));
}
export function useGetTeamLeaderboard(opts?: { limit?: number }) {
  const teams = Array.from({ length: opts?.limit ?? 10 }).map((_, i) => {
    const t = mockTeam(i + 1);
    const e: TeamLeaderboardEntry = {
      rank: i + 1, teamId: t.id, teamName: t.name,
      totalXp: t.totalXp, totalEarned: t.totalEarned,
      memberCount: t.memberCount, totalBookings: t.totalBookings,
    };
    return e;
  });
  return useAsyncMock(teams);
}
export function useGetTeam(id?: number | string) {
  const t = mockTeam(Number(id || 1));
  const detail: TeamDetail = {
    ...t,
    members: Array.from({ length: 8 }).map((_, i) => ({
      referrerId: i + 2, name: `${NAMES[i % NAMES.length]} ${String.fromCharCode(65 + i)}.`,
      persona: PERSONAS[i % PERSONAS.length] as any,
      level: LEVELS[i % LEVELS.length] as any,
      xp: 200 + i * 80, contributedXp: 100 + i * 40,
      bookedReferrals: i, joinedAt: now(),
    })) as any,
  } as any;
  return useAsyncMock(detail);
}
export function useCreateTeam() {
  return useMutationMock<{ data: { name: string; description: string } }, Team>(({ data }) => ({
    ...mockTeam(99), name: data.name, description: data.description,
  }));
}
export function useJoinTeam() {
  return useMutationMock<{ data: { inviteCode: string } }, { success: true; team: Team }>(() => ({ success: true, team: mockTeam(1) }));
}

// ───────────────── Challenges / Notifications ─────────────────
export function useGetChallenges(_id?: number) {
  return useAsyncMock(Array.from({ length: 6 }).map((_, i) => mockChallenge(i + 1)));
}
export function useCompleteChallenge() {
  return useMutationMock<{ challengeId: number }, { success: true; xpEarned: number }>(() => ({ success: true, xpEarned: 100 }));
}
export function useGetNotifications(_id?: number) {
  return useAsyncMock(Array.from({ length: 6 }).map((_, i) => mockNotification(i + 1)));
}
export function useMarkNotificationRead() {
  return useMutationMock<{ notificationId: number }>();
}
export function useMarkAllNotificationsRead() {
  return useMutationMock<void>();
}

// ───────────────── Payouts ─────────────────
export function useGetPayoutMethod(_id?: number) {
  const pm: PayoutMethod | null = null;
  return useAsyncMock(pm);
}
export function useSetPayoutMethod() {
  return useMutationMock<{ data: SetPayoutMethodBody }, PayoutMethod>(({ data }) => ({
    id: 1, type: (data as any).type, upiId: (data as any).upiId ?? null,
    accountName: (data as any).accountName ?? null, accountNumber: (data as any).accountNumber ?? null,
    ifscCode: (data as any).ifscCode ?? null, isVerified: true, createdAt: now(),
  } as any));
}

// ───────────────── Admin ─────────────────
export const AdminGetLeadsStatus = {
  NEW: "NEW", CONTACTED: "CONTACTED", VERIFIED: "VERIFIED", MATCHED: "MATCHED", VISIT: "VISIT", BOOKED: "BOOKED", CLOSED: "CLOSED", LOST: "LOST",
} as const;
export type AdminGetLeadsStatus = (typeof AdminGetLeadsStatus)[keyof typeof AdminGetLeadsStatus];

export function useAdminGetAnalytics() {
  const leads = getStoredLeads();
  const properties = getAllSeedProperties();
  const count = (status: string) => leads.filter((l) => l.status === status).length;
  const bookedLeads = count("BOOKED") + count("CLOSED");
  const verifiedLeads = count("VERIFIED") + count("MATCHED") + count("VISIT") + bookedLeads;
  const totalLeads = leads.length || 1;
  const summary: AnalyticsSummary = {
    totalLeads: leads.length,
    verifiedLeads,
    bookedLeads,
    lostLeads: count("LOST"),
    conversionRate: Math.round((bookedLeads / totalLeads) * 100),
    totalPayoutLiability: verifiedLeads * 50 + bookedLeads * 500,
    totalRevenue: bookedLeads * 2000,
    totalReferrers: 412,
    activeReferrers: 184,
    totalProperties: properties.length,
    leadsByStatus: Object.values(AdminGetLeadsStatus).map((s) => ({ status: s, count: count(s) })),
    leadsBySource: ["REFER_AND_EARN", "DIRECT", "PG_DETAIL"].map((s) => ({ source: s, count: leads.filter((l) => l.source === s).length })),
    recentLeads: leads.slice(0, 6),
    topEarners: mockLeaderboard(5),
  } as any;
  return useAsyncMock(summary);
}
export function useAdminGetLeads(_filter?: { status?: string; q?: string }) {
  let leads = getStoredLeads();
  if (_filter?.status) leads = leads.filter((l) => l.status === _filter.status);
  // Hydrate each lead with its notes so callers (dashboard analytics, SLA, activity) can use them.
  const allNotes = getNotes();
  const hydrated = leads.map((l: any) => ({
    ...l,
    notes: allNotes[String(l.id)] || [],
  }));
  const res: LeadsListResponse = { leads: hydrated, total: hydrated.length, offset: 0, limit: hydrated.length } as any;
  return useAsyncMock(res);
}
export function useAdminGetLead(id?: number | string) {
  const lead = getStoredLeads().find((l) => l.id === Number(id)) || toLead(mockReferral(Number(id || 1)));
  const detail: LeadDetail = {
    ...lead,
    notes: getLeadNotes(lead.id),
    timeline: [
      { status: "NEW", timestamp: lead.createdAt, note: "Lead submitted through Refer & Earn." },
      ...(lead.assignedAgentName ? [{ status: "ASSIGNED", timestamp: lead.updatedAt, note: `Assigned to ${lead.assignedAgentName}` }] : []),
    ],
  } as any;
  return useAsyncMock(detail);
}
export function getAdminGetLeadQueryKey(id: number | string) { return ["admin", "lead", id]; }
export function useAdminUpdateLeadStatus() {
  return useMutationMock<any, Lead>((args) => {
    const leadId = args.leadId ?? args.id;
    const incoming = args.data || {};
    const leads = getStoredLeads();
    const current = leads.find((l) => l.id === Number(leadId)) || toLead(mockReferral(Number(leadId || 1)));
    const agent = incoming.assignedAgentId ? GHARPAYY_AGENTS.find((a) => a.id === Number(incoming.assignedAgentId)) : undefined;
    let captainName: string | null = (current as any).captainName ?? null;
    if (incoming.captainId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { CAPTAIN_BY_ID } = require("@/lib/captains");
        captainName = CAPTAIN_BY_ID[incoming.captainId]?.name ?? null;
      } catch {}
    }
    const updated = upsertLead({
      ...current,
      status: incoming.status || current.status,
      assignedAgentId: incoming.assignedAgentId ?? (current as any).assignedAgentId ?? null,
      assignedAgentName: agent?.name ?? (captainName ? `${captainName} · expert` : current.assignedAgentName ?? null),
      captainId: incoming.captainId ?? (current as any).captainId ?? null,
      captainName: captainName ?? (current as any).captainName ?? null,
      updatedAt: now(),
    } as any);
    if (incoming.note || incoming.status || incoming.captainId) {
      const text = incoming.note
        || (incoming.captainId ? `Reassigned to ${captainName || incoming.captainId}.` : `Status changed to ${updated.status}.`);
      addLeadNote(updated.id, text, "STATUS_CHANGE", "Admin User");
    }
    return updated;
  });
}
export function useAdminBulkReassign() {
  return useMutationMock<{ leadIds: number[]; captainId: string }, { count: number }>((args) => {
    let captainName: string | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { CAPTAIN_BY_ID } = require("@/lib/captains");
      captainName = CAPTAIN_BY_ID[args.captainId]?.name ?? null;
    } catch {}
    const leads = getStoredLeads();
    let count = 0;
    for (const id of args.leadIds || []) {
      const current = leads.find((l) => l.id === Number(id));
      if (!current) continue;
      upsertLead({
        ...current,
        captainId: args.captainId,
        captainName,
        assignedAgentName: captainName ? `${captainName} · expert` : current.assignedAgentName ?? null,
        updatedAt: now(),
      } as any);
      addLeadNote(Number(id), `Bulk-reassigned to ${captainName || args.captainId}.`, "STATUS_CHANGE", "Admin User");
      count++;
    }
    return { count };
  });
}
export function useAdminAutoRoute() {
  return useMutationMock<void, { count: number }>(() => {
    let routed = 0;
    let helpers: any = {};
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      helpers = require("@/lib/captains");
    } catch {}
    const leads = getStoredLeads();
    for (const l of leads) {
      if ((l as any).captainId) continue;
      const expert =
        (l as any).personaId && helpers.captainForPersona ? helpers.captainForPersona((l as any).personaId)
        : (l.area && helpers.captainForArea ? helpers.captainForArea(l.area) : null);
      if (!expert) continue;
      upsertLead({
        ...l,
        captainId: expert.id,
        captainName: expert.name,
        assignedAgentName: `${expert.name} · expert`,
        updatedAt: now(),
      } as any);
      addLeadNote(l.id, `Auto-routed to ${expert.name}.`, "STATUS_CHANGE", "Routing Bot");
      routed++;
    }
    return { count: routed };
  });
}

export function useAdminAddLeadNote() {
  return useMutationMock<any, LeadNote>((args) => addLeadNote(args.leadId ?? args.id, args.data?.note || "Note added", args.data?.type || "NOTE", args.data?.agentName || "Admin User"));
}

// ───────────────── Owner Real APIs ─────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const getBackendUrl = () => {
  if (typeof window === "undefined") return "http://localhost:4000";
  return `http://${window.location.hostname}:4000`;
};

export function useOwnerLogin() {
  return useMutationMock<any, any>(async (args) => {
    const res = await fetch(`${getBackendUrl()}/api/v1/owner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error("API RESPONSE FAILED:", { status: res.status, data });
      throw new Error(data?.message || "Failed to login");
    }
    return data;
  });
}

export function useGetRealOwnerProperties(token: string | null) {
  return useQuery({
    queryKey: ["owner", "properties"],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch properties");
      return data.data.map((pg: any) => ({
        id: pg._id || pg.id,
        name: pg.name,
        address: pg.address || pg.locality || pg.area,
        monthlyRent: pg.basePrice || pg.pricePerBed || 0,
        totalRooms: pg.totalBeds || pg.totalRooms || 0,
        availableRooms: pg.vacantBeds || pg.availableRooms || 0,
        availability: (pg.availableRooms > 0) ? "AVAILABLE" : "FULL",
        isVerified: pg.isVerified ?? true,
        avgRating: pg.avgRating ?? 4.0,
      }));
    },
    enabled: !!token
  });
}

export function useGetRealOwnerRooms(token: string | null) {
  return useQuery({
    queryKey: ["owner", "rooms"],
    queryFn: async () => {
      if (!token) return { rooms: [], roomStatuses: [], roomMedia: [] };
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch rooms");
      return data.data;
    },
    enabled: !!token
  });
}

export function useAddRealOwnerRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data: any }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to add room");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "rooms"] });
    }
  });
}

export function useDeleteRealOwnerRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, roomId }: { token: string; roomId: string }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete room");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "rooms"] });
    }
  });
}

export function useUpdateRealOwnerRoomStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, roomId, data }: { token: string; roomId: string; data: any }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/rooms/${roomId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update room status");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "rooms"] });
    }
  });
}

export function useVerifyRealOwnerRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, roomId }: { token: string; roomId: string }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/rooms/${roomId}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to verify room");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "rooms"] });
    }
  });
}

export function useGetOwnerVisits(token: string | null) {
  return useQuery({
    queryKey: ["owner", "visits"],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch visits");
      return data.data;
    },
    enabled: !!token
  });
}

export function useAddOwnerVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data: any }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to add visit");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "visits"] });
    }
  });
}

export function useUpdateOwnerVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, visitId, status }: { token: string; visitId: string; status: string }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/visits/${visitId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update visit status");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "visits"] });
    }
  });
}

export function useGetOwnerActions(token: string | null) {
  return useQuery({
    queryKey: ["owner", "actions"],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch actions");
      return data.data;
    },
    enabled: !!token
  });
}

export function useAddOwnerAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data: any }) => {
      const res = await fetch(`${getBackendUrl()}/api/v1/owner/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to add action");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "actions"] });
    }
  });
}

export function useGetAdminActions(ownerId?: string | null) {
  return useQuery({
    queryKey: ["admin", "actions", ownerId],
    queryFn: async () => {
      const url = new URL(`${getBackendUrl()}/api/admin/actions`);
      if (ownerId) url.searchParams.set("ownerId", ownerId);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch actions");
      return data.data;
    }
  });
}

export function useAddAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${getBackendUrl()}/api/admin/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to add admin action");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "actions"] });
    }
  });
}

export function useUpdateRoomDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, demandScore }: { roomId: string, demandScore: number }) => {
      const res = await fetch(`${getBackendUrl()}/api/admin/rooms/${roomId}/demand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ demandScore }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update demand score");
      return json.demandScore;
    },
    onSuccess: () => {
      // we might need to invalidate owner rooms, but admin rooms are currently mock-hydrated from localStorage. 
      // If we implement live fetching for admin later, we can invalidate it.
      // But we should invalidate owner real rooms.
      queryClient.invalidateQueries({ queryKey: ["owner", "rooms"] });
    }
  });
}

export function useDeleteAdminRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`${getBackendUrl()}/api/admin/rooms/${roomId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete room");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["owner", "rooms"] });
      queryClient.invalidateQueries({ queryKey: ["owner", "stats"] });
    }
  });
}

export function useUpdateAdminRoomStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string, status: string }) => {
      const res = await fetch(`${getBackendUrl()}/api/admin/rooms/${roomId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update room status");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["owner", "rooms"] });
      queryClient.invalidateQueries({ queryKey: ["owner", "stats"] });
    }
  });
}

export function useAdminGetPayouts(_filter?: { status?: string }) {
  return useAsyncMock(Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1, referrerId: i + 1, referrerName: `${NAMES[i % NAMES.length]} ${String.fromCharCode(65 + i)}.`,
    amount: 250 + i * 100,
    status: i < 3 ? "PENDING" : i < 6 ? "APPROVED" : "PAID",
    method: i % 2 ? "UPI" : "BANK", createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  })));
}
export function getAdminGetPayoutsQueryKey() { return ["admin", "payouts"]; }
export function useAdminApprovePayout() { return useMutationMock<{ id: number }>(); }
export function useAdminMarkPayoutPaid() { return useMutationMock<{ id: number }>(); }
export function useAdminGetProperties(_filter?: { verified?: boolean }) {
  const properties = getAllSeedProperties();
  const filtered = _filter?.verified == null ? properties : properties.filter((property) => property.isVerified === _filter.verified);
  return useAsyncMock(filtered);
}
export function useAdminVerifyProperty() { return useMutationMock<{ id: number }>(); }
