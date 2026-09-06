import { getConvictionFeed } from "@/lib/news";
import { parseConvictions } from "@/lib/news/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const convictions = parseConvictions(new URL(request.url).searchParams);

  if (convictions.length === 0) {
    return Response.json(
      { articles: [], mode: "empty", sources: "" },
      { status: 400 },
    );
  }

  const payload = await getConvictionFeed(convictions);
  return Response.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=60",
    },
  });
}
