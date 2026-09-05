import articlesJson from "@/data/articles.json";
import type { Article, Conviction } from "./types";

export const ARTICLES = articlesJson as Article[];

export function filterArticles(convictions: Conviction[]): Article[] {
  const biasByCoin = new Map(convictions.map((item) => [item.coin, item.bias]));

  return ARTICLES.filter((article) => biasByCoin.get(article.coin) === article.bias)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}
