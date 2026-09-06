"use client";

export const SESSION_ID_KEY = "ncnc.sid";
export const PAGEVIEW_KEY = "ncnc.pv";

type TelemetryEvent = "signup" | "lock" | "pageview";

let memoryId: string | null = null;

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return memoryId ?? "anon";

  try {
    const existing = window.localStorage.getItem(SESSION_ID_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) {
      memoryId = existing;
      return existing;
    }
    const id = randomId();
    window.localStorage.setItem(SESSION_ID_KEY, id);
    memoryId = id;
    return id;
  } catch {
    if (!memoryId) memoryId = randomId();
    return memoryId;
  }
}

export function track(event: TelemetryEvent) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    event,
    meta: { sessionId: getAnonymousSessionId() },
  });

  void fetch("/api/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Telemetry must never block the product.
  });
}

export function trackPageviewOnce() {
  if (typeof window === "undefined") return;

  try {
    if (window.sessionStorage.getItem(PAGEVIEW_KEY)) return;
    window.sessionStorage.setItem(PAGEVIEW_KEY, "1");
  } catch {
    // If sessionStorage is blocked, still send one pageview this load.
  }

  track("pageview");
}
