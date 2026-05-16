import {
  calculateFromEvents,
  createFounderEvent,
  EventSource,
  FounderEventKind,
  type FounderEvent,
  type GrowthSnapshot,
  type JsonValue,
} from "@/lib/pet-engine";

export interface FounderProfile {
  id: string;
  handle: string;
  displayName: string;
  projectName: string;
  avatarEmoji: string;
  createdAt: string;
}

export interface PetState {
  profile: FounderProfile;
  snapshot: GrowthSnapshot;
  events: FounderEvent[];
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  handle: string;
  displayName: string;
  projectName: string;
  avatarEmoji: string;
  stage: string;
  mood: string;
  level: number;
  exp: number;
  trustScore: number;
  leaderboardScore: number;
  verifiedRevenue: number;
  revenue30d: number;
  streakDays: number;
  updatedAt: string;
}

export interface RecordEventResult {
  event: FounderEvent;
  duplicate: boolean;
  state: PetState;
}

type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns?: string) => any;
    insert: (payload: unknown) => any;
    upsert: (payload: unknown, options?: unknown) => any;
    eq: (column: string, value: unknown) => any;
    order: (column: string, options?: unknown) => any;
    limit: (count: number) => any;
  };
};

const MEMORY_PROFILES = new Map<string, FounderProfile>();
const MEMORY_EVENTS = new Map<string, FounderEvent[]>();

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "founder";
}

function defaultProfile(userId: string): FounderProfile {
  const handle = slugify(userId === "demo" ? "duct-tape2" : userId);
  return {
    id: userId,
    handle,
    displayName: userId === "demo" ? "Duct Tape Founder" : handle,
    projectName: userId === "demo" ? "FounderPet" : "Indie Project",
    avatarEmoji: userId === "demo" ? "🐉" : "🥚",
    createdAt: nowIso(),
  };
}

function seedMemory() {
  if (MEMORY_PROFILES.has("demo")) return;
  const profile = defaultProfile("demo");
  MEMORY_PROFILES.set(profile.id, profile);

  const now = new Date();
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  MEMORY_EVENTS.set("demo", [
    createFounderEvent({
      id: "seed_github_1",
      userId: "demo",
      kind: FounderEventKind.GITHUB_COMMIT,
      source: EventSource.GITHUB,
      value: 4,
      occurredAt: hoursAgo(2),
      verified: true,
      externalId: "push-2026-05-16-a",
      metadata: { repo: "duct-tape2/founderpet" },
    }),
    createFounderEvent({
      id: "seed_agent_1",
      userId: "demo",
      kind: FounderEventKind.AGENT_RUN,
      source: EventSource.CLAUDE,
      value: 1,
      occurredAt: hoursAgo(3),
      verified: false,
      confidence: 0.85,
      externalId: "claude-run-market-audit",
    }),
    createFounderEvent({
      id: "seed_task_1",
      userId: "demo",
      kind: FounderEventKind.TASK_DONE,
      source: EventSource.MANUAL,
      value: 1,
      occurredAt: hoursAgo(4),
      confidence: 0.8,
      externalId: "task-launch-checklist",
    }),
    createFounderEvent({
      id: "seed_revenue_1",
      userId: "demo",
      kind: FounderEventKind.REVENUE,
      source: EventSource.STRIPE,
      value: 49,
      currency: "USD",
      occurredAt: hoursAgo(9),
      verified: true,
      externalId: "pi_demo_49_usd",
      metadata: { product: "FounderPet Early Access" },
    }),
    createFounderEvent({
      id: "seed_lead_1",
      userId: "demo",
      kind: FounderEventKind.LEAD,
      source: EventSource.API,
      value: 3,
      occurredAt: hoursAgo(16),
      confidence: 0.75,
      externalId: "leads-demo-3",
    }),
  ]);
}

seedMemory();

async function getSupabase(): Promise<SupabaseClientLike | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SupabaseClientLike;
}

function dbProfileToProfile(row: any): FounderProfile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name ?? row.handle,
    projectName: row.project_name ?? "Indie Project",
    avatarEmoji: row.avatar_emoji ?? "🥚",
    createdAt: row.created_at ?? nowIso(),
  };
}

function dbEventToEvent(row: any): FounderEvent {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    source: row.source,
    value: Number(row.value ?? 0),
    currency: row.currency ?? undefined,
    verified: Boolean(row.verified),
    confidence: row.confidence === null || row.confidence === undefined ? undefined : Number(row.confidence),
    externalId: row.external_id ?? undefined,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? undefined,
  };
}

function eventToDb(event: FounderEvent) {
  return {
    id: event.id,
    user_id: event.userId,
    kind: event.kind,
    source: event.source,
    value: event.value,
    currency: event.currency ?? null,
    verified: Boolean(event.verified),
    confidence: event.confidence ?? null,
    external_id: event.externalId ?? null,
    occurred_at: event.occurredAt instanceof Date ? event.occurredAt.toISOString() : event.occurredAt,
    metadata: event.metadata ?? {},
  };
}

function profileToDb(profile: FounderProfile) {
  return {
    id: profile.id,
    handle: profile.handle,
    display_name: profile.displayName,
    project_name: profile.projectName,
    avatar_emoji: profile.avatarEmoji,
    created_at: profile.createdAt,
  };
}

export async function ensureProfile(input: Partial<FounderProfile> & { id: string }): Promise<FounderProfile> {
  const profile: FounderProfile = {
    ...defaultProfile(input.id),
    ...input,
    handle: slugify(input.handle ?? input.id),
    createdAt: input.createdAt ?? nowIso(),
  };

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("founder_profiles")
      .upsert(profileToDb(profile), { onConflict: "id" })
      .select("*")
      .limit(1);
    if (!error && data?.[0]) return dbProfileToProfile(data[0]);
  }

  const existing = MEMORY_PROFILES.get(profile.id);
  const merged = existing ? { ...existing, ...profile } : profile;
  MEMORY_PROFILES.set(merged.id, merged);
  return merged;
}

async function loadProfile(userId: string): Promise<FounderProfile> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("founder_profiles").select("*").eq("id", userId).limit(1);
    if (!error && data?.[0]) return dbProfileToProfile(data[0]);
  }

  const profile = MEMORY_PROFILES.get(userId) ?? defaultProfile(userId);
  MEMORY_PROFILES.set(userId, profile);
  return profile;
}

async function loadEvents(userId: string, limit?: number): Promise<FounderEvent[]> {
  const supabase = await getSupabase();
  if (supabase) {
    let query = supabase
      .from("founder_events")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (!error && data) return data.map(dbEventToEvent).reverse();
  }

  const events = MEMORY_EVENTS.get(userId) ?? [];
  const sorted = [...events].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  return limit ? sorted.slice(-limit) : sorted;
}

export async function getPetState(userId = "demo"): Promise<PetState> {
  const [profile, events] = await Promise.all([loadProfile(userId), loadEvents(userId)]);
  const snapshot = calculateFromEvents(events);
  return {
    profile,
    events,
    snapshot,
    updatedAt: nowIso(),
  };
}

export async function getRecentEvents(userId = "demo", limit = 20): Promise<FounderEvent[]> {
  return loadEvents(userId, limit);
}

export async function recordFounderEvent(
  input: Partial<FounderEvent> & {
    userId: string;
    kind: FounderEventKind | `${FounderEventKind}`;
    source?: EventSource | `${EventSource}` | string;
    value?: number;
    metadata?: Record<string, JsonValue>;
  },
): Promise<RecordEventResult> {
  await ensureProfile({ id: input.userId, handle: input.userId === "demo" ? "duct-tape2" : input.userId });

  const event = createFounderEvent({
    id: input.id ?? randomId("evt"),
    userId: input.userId,
    kind: input.kind,
    source: input.source ?? EventSource.API,
    value: input.value ?? 1,
    currency: input.currency,
    verified: input.verified,
    confidence: input.confidence,
    externalId: input.externalId,
    occurredAt: input.occurredAt ?? new Date(),
    metadata: input.metadata,
  });

  const supabase = await getSupabase();
  if (supabase) {
    const { error } = await supabase.from("founder_events").insert(eventToDb(event));
    if (error) {
      const maybeDuplicate = String(error.code ?? "") === "23505" || String(error.message ?? "").includes("duplicate");
      if (!maybeDuplicate) throw new Error(`Failed to record FounderPet event: ${error.message}`);

      const { data } = await supabase
        .from("founder_events")
        .select("*")
        .eq("user_id", event.userId)
        .eq("source", event.source)
        .eq("external_id", event.externalId ?? "")
        .limit(1);
      const existing = data?.[0] ? dbEventToEvent(data[0]) : event;
      return { event: existing, duplicate: true, state: await getPetState(event.userId) };
    }
    return { event, duplicate: false, state: await getPetState(event.userId) };
  }

  const events = MEMORY_EVENTS.get(event.userId) ?? [];
  const duplicate = events.find((existing) => {
    if (event.externalId && existing.externalId) {
      return existing.source === event.source && existing.externalId === event.externalId;
    }
    return existing.id === event.id;
  });

  if (duplicate) {
    return { event: duplicate, duplicate: true, state: await getPetState(event.userId) };
  }

  events.push(event);
  MEMORY_EVENTS.set(event.userId, events);
  return { event, duplicate: false, state: await getPetState(event.userId) };
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const supabase = await getSupabase();
  let profiles: FounderProfile[] = [];
  let eventsByUser = new Map<string, FounderEvent[]>();

  if (supabase) {
    const [{ data: profileRows, error: profileError }, { data: eventRows, error: eventError }] = await Promise.all([
      supabase.from("founder_profiles").select("*"),
      supabase.from("founder_events").select("*"),
    ]);

    if (!profileError && profileRows) profiles = profileRows.map(dbProfileToProfile);
    if (!eventError && eventRows) {
      for (const row of eventRows) {
        const event = dbEventToEvent(row);
        const list = eventsByUser.get(event.userId) ?? [];
        list.push(event);
        eventsByUser.set(event.userId, list);
      }
    }
  } else {
    profiles = [...MEMORY_PROFILES.values()];
    eventsByUser = new Map(MEMORY_EVENTS);
  }

  return profiles
    .map((profile) => {
      const events = eventsByUser.get(profile.id) ?? [];
      const snapshot = calculateFromEvents(events);
      return {
        rank: 0,
        userId: profile.id,
        handle: profile.handle,
        displayName: profile.displayName,
        projectName: profile.projectName,
        avatarEmoji: profile.avatarEmoji,
        stage: snapshot.stage,
        mood: snapshot.mood,
        level: snapshot.level,
        exp: snapshot.exp,
        trustScore: snapshot.trustScore,
        leaderboardScore: snapshot.leaderboardScore,
        verifiedRevenue: snapshot.verifiedRevenue,
        revenue30d: snapshot.revenue30d,
        streakDays: snapshot.streakDays,
        updatedAt: nowIso(),
      };
    })
    .sort((a, b) => b.leaderboardScore - a.leaderboardScore || b.verifiedRevenue - a.verifiedRevenue)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function verifyIngestSecret(request: Request): boolean {
  const secret = process.env.FOUNDERPET_INGEST_SECRET;
  if (!secret) return true;
  const provided = request.headers.get("x-founderpet-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === secret;
}

export async function getPetStateByHandle(handle: string): Promise<PetState> {
  const normalized = slugify(handle.replace(/^@/, ""));
  const supabase = await getSupabase();

  if (supabase) {
    const { data, error } = await supabase.from("founder_profiles").select("*").eq("handle", normalized).limit(1);
    if (!error && data?.[0]) return getPetState(data[0].id);
  }

  const profile = [...MEMORY_PROFILES.values()].find((item) => item.handle === normalized);
  if (profile) return getPetState(profile.id);

  return getPetState(normalized);
}
