const TAG_RE = (name: string) =>
  new RegExp(`<${name}(?:\\s[^>]*)?>(?:\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*|([\\s\\S]*?))</${name}>`, "i");

export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function stripHtml(value: string): string {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function innerTag(xml: string, name: string): string {
  const match = xml.match(TAG_RE(name));
  if (!match) return "";
  return stripHtml(match[1] ?? match[2] ?? "");
}

function hrefFromLink(xml: string): string {
  const atom = xml.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i);
  if (atom?.[1]) return decodeEntities(atom[1]).trim();
  return innerTag(xml, "link");
}

export function isArticleUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const path = url.pathname.toLowerCase();
    if (path.includes("/video") || path.includes("/podcast") || path.includes("/watch")) {
      return false;
    }
    return /^https?:$/i.test(url.protocol);
  } catch {
    return false;
  }
}

export function cleanUrl(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    return url.toString();
  } catch {
    return raw.trim();
  }
}

export type RssItem = {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
};

export function parseRssItems(xml: string): RssItem[] {
  const blocks = [
    ...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi),
  ];

  const items: RssItem[] = [];

  for (const block of blocks) {
    const body = block[1] ?? "";
    const title = innerTag(body, "title");
    const url = cleanUrl(hrefFromLink(body) || innerTag(body, "guid"));
    if (!title || !url || !isArticleUrl(url)) continue;

    const dateRaw =
      innerTag(body, "pubDate") ||
      innerTag(body, "published") ||
      innerTag(body, "updated") ||
      innerTag(body, "dc:date");
    const parsed = dateRaw ? new Date(dateRaw) : new Date();
    const publishedAt = Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();

    items.push({
      title,
      url,
      publishedAt,
      summary: innerTag(body, "description") || innerTag(body, "summary"),
    });
  }

  return items;
}
