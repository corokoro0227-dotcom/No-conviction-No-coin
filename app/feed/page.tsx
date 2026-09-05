"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Guard } from "@/components/Guard";
import { filterArticles } from "@/lib/articles";
import { coinById } from "@/lib/coins";
import { formatRelativeTime } from "@/lib/format";
import { useApp } from "@/lib/session";

export default function FeedPage() {
  const { profile } = useApp();
  const convictions = profile?.convictions ?? [];
  const articles = filterArticles(convictions);

  return (
    <Guard gate="locked">
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-12 pt-6 sm:px-8 sm:pt-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <BrandMark href="/feed" />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {convictions.map((item) => (
                <span
                  key={item.coin}
                  className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-signal"
                >
                  {coinById(item.coin).ticker}
                  <span className="text-signal/70">·</span>
                  {item.bias}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/settings"
            className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mist hover:text-paper"
          >
            Settings
          </Link>
        </header>

        <main className="mt-8 flex-1">
          {articles.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col justify-center border-y border-line py-16">
              <p className="text-[1.6rem] font-semibold tracking-[-0.03em] text-paper">
                Silence is the feature.
              </p>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-mist">
                A conviction doesn’t need a headline every hour.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {articles.map((article) => (
                <li key={article.id}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block py-5 transition-colors hover:bg-ink/80"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
                        {article.source}
                        <span className="mx-2 text-line">/</span>
                        {formatRelativeTime(article.publishedAt)}
                        <span className="mx-2 text-line">/</span>
                        {article.coin}
                      </p>
                      <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
                        Match {article.match}%
                      </p>
                    </div>
                    <h2 className="mt-2 text-[17px] font-medium leading-snug tracking-[-0.02em] text-paper sm:text-[18px]">
                      {article.headline}
                    </h2>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </Guard>
  );
}
