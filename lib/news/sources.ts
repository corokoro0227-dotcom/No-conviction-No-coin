import type { CoinId } from "../types";
import { classifyStory } from "./classify";
import { parseRssItems, type RssItem } from "./rss";

export type IngestedArticle = {
  id: string;
  coin: CoinId;
  bias: "bullish" | "bearish";
  headline: string;
  source: string;
  publishedAt: string;
  match: number;
  url: string;
};

type FeedConfig = {
  url: string;
  source: string;
  coin?: CoinId;
};

const USER_AGENT =
  "NoConvictionNoCoin/0.1 (+https://github.com/corokoro0227-dotcom/No-conviction-No-coin)";

const RSS_FEEDS: FeedConfig[] = [
  {
    url: "https://cointelegraph.com/rss/tag/bitcoin",
    source: "Cointelegraph",
    coin: "BTC",
  },
  {
    url: "https://cointelegraph.com/rss/tag/ethereum",
    source: "Cointelegraph",
    coin: "ETH",
  },
  {
    url: "https://cointelegraph.com/rss/tag/solana",
    source: "Cointelegraph",
    coin: "SOL",
  },
  {
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    source: "CoinDesk",
  },
  {
    url: "https://decrypt.co/feed",
    source: "Decrypt",
  },
  {
    url: "https://www.newsbtc.com/feed/",
    source: "NewsBTC",
  },
  {
    url: "https://news.bitcoin.com/feed/",
    source: "Bitcoin.com",
    coin: "BTC",
  },
  {
    url: "https://bitcoinmagazine.com/.rss/full/",
    source: "Bitcoin Magazine",
    coin: "BTC",
  },
];

const FETCH_MS = 8_000;

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, application/json;q=0.8, */*;q=0.5",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(FETCH_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function articleId(coin: CoinId, url: string): string {
  const raw = `${coin}:${url}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function toArticle(
  item: RssItem,
  source: string,
  hint?: CoinId,
): IngestedArticle | null {
  const classified = classifyStory(item.title, item.summary, hint);
  if (!classified) return null;

  return {
    id: articleId(classified.coin, item.url),
    coin: classified.coin,
    bias: classified.bias,
    headline: item.title,
    source,
    publishedAt: item.publishedAt,
    match: classified.match,
    url: item.url,
  };
}

async function ingestRss(): Promise<IngestedArticle[]> {
  const pages = await Promise.all(
    RSS_FEEDS.map(async (feed) => {
      const xml = await fetchText(feed.url);
      if (!xml) return [] as IngestedArticle[];
      return parseRssItems(xml)
        .map((item) => toArticle(item, feed.source, feed.coin))
        .filter((item): item is IngestedArticle => item !== null);
    }),
  );
  return pages.flat();
}

type PanicPost = {
  title?: string;
  url?: string;
  original_url?: string;
  published_at?: string;
  created_at?: string;
  source?: { title?: string };
  currencies?: Array<{ code?: string }>;
  votes?: { positive?: number; negative?: number };
};

function panicCoin(post: PanicPost): CoinId | undefined {
  const codes = new Set(
    (post.currencies ?? [])
      .map((item) => item.code?.toUpperCase())
      .filter(Boolean),
  );
  if (codes.has("BTC")) return "BTC";
  if (codes.has("ETH")) return "ETH";
  if (codes.has("SOL")) return "SOL";
  return undefined;
}

function panicVotes(post: PanicPost): { title: string; summary: string } {
  const positive = post.votes?.positive ?? 0;
  const negative = post.votes?.negative ?? 0;
  const tilt =
    positive >= negative + 2
      ? "bullish inflows"
      : negative >= positive + 2
        ? "bearish outflows"
        : "";
  return {
    title: post.title ?? "",
    summary: tilt,
  };
}

async function ingestCryptoPanic(): Promise<IngestedArticle[]> {
  const token = process.env.CRYPTOPANIC_AUTH_TOKEN?.trim();
  if (!token) return [];

  const endpoints = [
    `https://cryptopanic.com/api/developer/v2/posts/?auth_token=${encodeURIComponent(token)}&currencies=BTC,ETH,SOL&public=true&kind=news`,
    `https://cryptopanic.com/api/v1/posts/?auth_token=${encodeURIComponent(token)}&currencies=BTC,ETH,SOL&public=true&kind=news`,
  ];

  for (const endpoint of endpoints) {
    const body = await fetchText(endpoint);
    if (!body) continue;

    try {
      const parsed = JSON.parse(body) as { results?: PanicPost[] };
      const results = parsed.results ?? [];
      if (results.length === 0) continue;

      return results
        .map((post) => {
          const url = post.original_url || post.url || "";
          const title = post.title?.trim() ?? "";
          if (!title || !url) return null;
          const votes = panicVotes(post);
          const classified = classifyStory(
            votes.title,
            votes.summary,
            panicCoin(post),
          );
          if (!classified) return null;
          return {
            id: articleId(classified.coin, url),
            coin: classified.coin,
            bias: classified.bias,
            headline: title,
            source: post.source?.title || "CryptoPanic",
            publishedAt: post.published_at || post.created_at || new Date().toISOString(),
            match: classified.match,
            url,
          } satisfies IngestedArticle;
        })
        .filter((item): item is IngestedArticle => item !== null);
    } catch {
      continue;
    }
  }

  return [];
}

function dedupe(articles: IngestedArticle[]): IngestedArticle[] {
  const seen = new Set<string>();
  const out: IngestedArticle[] = [];

  for (const article of articles) {
    const key = `${article.coin}:${article.url.toLowerCase()}`;
    const titleKey = `${article.coin}:${article.headline.toLowerCase()}`;
    if (seen.has(key) || seen.has(titleKey)) continue;
    seen.add(key);
    seen.add(titleKey);
    out.push(article);
  }

  return out;
}

export async function ingestLiveNews(): Promise<IngestedArticle[]> {
  const [rss, panic] = await Promise.all([ingestRss(), ingestCryptoPanic()]);
  return dedupe([...panic, ...rss]).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export const NEWS_SOURCE_LABEL =
  "Cointelegraph, CoinDesk, Decrypt, NewsBTC, Bitcoin Magazine, Bitcoin.com";
