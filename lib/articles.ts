import articlesJson from "@/data/articles.json";
import type { Article, Conviction } from "./types";

export const ARTICLES = articlesJson as Article[];

export function filterArticles(
  convictions: Conviction[],
  articles: Article[] = ARTICLES,
): Article[] {
  const biasByCoin = new Map(convictions.map((item) => [item.coin, item.bias]));

  return articles
    .filter((article) => biasByCoin.get(article.coin) === article.bias)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function convictionQuery(convictions: Conviction[]): string {
  return convictions.map((item) => `${item.coin}:${item.bias}`).join(",");
}
