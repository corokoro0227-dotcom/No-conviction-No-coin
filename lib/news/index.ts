import { ARTICLES, filterArticles } from "../articles";
import type { Article, Conviction } from "../types";
import { ingestLiveNews, NEWS_SOURCE_LABEL, type IngestedArticle } from "./sources";

export type FeedMode = "live" | "cache" | "sample";

export type FeedPayload = {
  articles: Article[];
  mode: FeedMode;
  sources: string;
};

const TTL_MS = Number.parseInt(process.env.NEWS_CACHE_TTL_MS ?? "", 10) || 10 * 60 * 1000;

let freshUntil = 0;
let lastGood: IngestedArticle[] | null = null;

export async function getConvictionFeed(
  convictions: Conviction[],
): Promise<FeedPayload> {
  const now = Date.now();

  if (lastGood && now < freshUntil) {
    return {
      articles: filterArticles(convictions, lastGood),
      mode: "live",
      sources: NEWS_SOURCE_LABEL,
    };
  }

  const live = await ingestLiveNews();
  if (live.length > 0) {
    lastGood = live;
    freshUntil = now + TTL_MS;
    return {
      articles: filterArticles(convictions, live),
      mode: "live",
      sources: NEWS_SOURCE_LABEL,
    };
  }

  if (lastGood) {
    return {
      articles: filterArticles(convictions, lastGood),
      mode: "cache",
      sources: NEWS_SOURCE_LABEL,
    };
  }

  return {
    articles: filterArticles(convictions, ARTICLES),
    mode: "sample",
    sources: "Sealed sample tape",
  };
}

export { NEWS_SOURCE_LABEL };
