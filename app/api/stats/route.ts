import { isValidDay, statsForDay, TOKYO_TZ, yesterdayTokyo } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("day");
  const day = raw?.trim() || yesterdayTokyo();

  if (!isValidDay(day)) {
    return Response.json(
      { error: "day must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const stats = await statsForDay(day);
  return Response.json(
    { ...stats, timezone: TOKYO_TZ },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
