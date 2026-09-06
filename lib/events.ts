/**
 * First-party operator event log (JSONL).
 * Default path: <cwd>/data/events.jsonl
 * Override: NCNC_EVENTS_PATH
 * Fallback if unwritable: /tmp/ncnc-events.jsonl
 */
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export const TELEMETRY_EVENTS = ["signup", "lock", "pageview"] as const;
export type TelemetryEvent = (typeof TELEMETRY_EVENTS)[number];

export const TOKYO_TZ = "Asia/Tokyo";

export type EventMeta = {
  sessionId?: string;
};

export type EventLine = {
  ts: string;
  event: TelemetryEvent;
  meta?: EventMeta;
};

export type DayStats = {
  day: string;
  timezone: typeof TOKYO_TZ;
  visitors: number;
  signups: number;
  locks: number;
  pageviews: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DEFAULT_FILE = path.join(DATA_DIR, "events.jsonl");
const FALLBACK_PATH = path.join("/tmp", "ncnc-events.jsonl");

export function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  return (
    typeof value === "string" &&
    (TELEMETRY_EVENTS as readonly string[]).includes(value)
  );
}

export function configuredEventsPath(): string {
  const override = process.env.NCNC_EVENTS_PATH?.trim();
  if (override) return override;
  return DEFAULT_FILE;
}

export function tokyoCalendarDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addCalendarDays(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + delta));
  const yyyy = String(next.getUTCFullYear());
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function yesterdayTokyo(now = new Date()): string {
  return addCalendarDays(tokyoCalendarDay(now), -1);
}

export function isValidDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, date] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, date));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === date
  );
}

export function sanitizeMeta(raw: unknown): EventMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const sessionId = (raw as { sessionId?: unknown }).sessionId;
  if (typeof sessionId !== "string") return undefined;
  const cleaned = sessionId.trim().slice(0, 64);
  if (!/^[A-Za-z0-9_-]+$/.test(cleaned)) return undefined;
  return { sessionId: cleaned };
}

export function summarizeDay(events: EventLine[], day: string): DayStats {
  const visitors = new Set<string>();
  let signups = 0;
  let locks = 0;
  let pageviews = 0;
  let actorSeq = 0;

  for (const entry of events) {
    const ts = Date.parse(entry.ts);
    if (Number.isNaN(ts)) continue;
    if (tokyoCalendarDay(new Date(ts)) !== day) continue;

    if (entry.event === "signup") signups += 1;
    if (entry.event === "lock") locks += 1;
    if (entry.event === "pageview") pageviews += 1;

    const sessionId = entry.meta?.sessionId;
    if (sessionId) {
      visitors.add(`sid:${sessionId}`);
    } else if (entry.event === "signup" || entry.event === "lock") {
      actorSeq += 1;
      visitors.add(`actor:${entry.event}:${entry.ts}:${actorSeq}`);
    }
  }

  return {
    day,
    timezone: TOKYO_TZ,
    visitors: visitors.size,
    signups,
    locks,
    pageviews,
  };
}

export function parseEventLog(raw: string): EventLine[] {
  const events: EventLine[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Partial<EventLine>;
      if (!isTelemetryEvent(parsed.event) || typeof parsed.ts !== "string") {
        continue;
      }
      events.push({
        ts: parsed.ts,
        event: parsed.event,
        meta: sanitizeMeta(parsed.meta),
      });
    } catch {
      // skip corrupt lines
    }
  }
  return events;
}

let resolvedPath: string | null = null;

async function appendChunk(file: string, chunk: string) {
  if (file === DEFAULT_FILE) {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(DEFAULT_FILE, chunk, "utf8");
    return;
  }
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(/*turbopackIgnore: true*/ file, chunk, "utf8");
}

async function readChunk(file: string): Promise<string> {
  if (file === DEFAULT_FILE) {
    return readFile(DEFAULT_FILE, "utf8");
  }
  return readFile(/*turbopackIgnore: true*/ file, "utf8");
}

async function resolveWritablePath(): Promise<string> {
  if (resolvedPath) return resolvedPath;

  const primary = configuredEventsPath();
  try {
    await appendChunk(primary, "");
    resolvedPath = primary;
    return primary;
  } catch {
    await appendChunk(FALLBACK_PATH, "");
    resolvedPath = FALLBACK_PATH;
    return FALLBACK_PATH;
  }
}

export async function eventsPath(): Promise<string> {
  return resolveWritablePath();
}

export async function appendEvent(event: TelemetryEvent, meta?: EventMeta) {
  const line: EventLine = {
    ts: new Date().toISOString(),
    event,
    ...(meta ? { meta } : {}),
  };
  const chunk = `${JSON.stringify(line)}\n`;
  const file = await resolveWritablePath();
  try {
    await appendChunk(file, chunk);
  } catch {
    if (file !== FALLBACK_PATH) {
      resolvedPath = FALLBACK_PATH;
      await appendChunk(FALLBACK_PATH, chunk);
    } else {
      throw new Error("event log is not writable");
    }
  }
}

export async function readEvents(): Promise<EventLine[]> {
  const file = await resolveWritablePath();
  try {
    return parseEventLog(await readChunk(file));
  } catch {
    return [];
  }
}

export async function statsForDay(day: string): Promise<DayStats> {
  return summarizeDay(await readEvents(), day);
}

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const hits = new Map<string, number[]>();

export function allowEvent(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
