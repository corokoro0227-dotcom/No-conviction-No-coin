import {
  allowEvent,
  appendEvent,
  clientIp,
  isTelemetryEvent,
  sanitizeMeta,
} from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowEvent(clientIp(request))) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const event = (payload as { event?: unknown }).event;
  if (!isTelemetryEvent(event)) {
    return Response.json({ error: "invalid event" }, { status: 400 });
  }

  const meta = sanitizeMeta((payload as { meta?: unknown }).meta);

  try {
    await appendEvent(event, meta);
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
