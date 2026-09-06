# No conviction No coin

Crypto news diet: lock a bullish or bearish stance per coin, then only see news that matches.

The feed is a filter, not a forecast. Unclear headlines stay out. Silence is the feature. This is not financial advice.

```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in (local mock), pick BTC / ETH / SOL, lock a bias. After lock, the stance cannot be edited.

## News source

The feed is assembled **on the server** and cached in memory for **10 minutes**.

**Default (no API key):** public RSS from reputable publishers

- [Cointelegraph](https://cointelegraph.com/rss) tag feeds for Bitcoin, Ethereum, and Solana
- [CoinDesk](https://www.coindesk.com/arc/outboundfeeds/rss/)
- [Decrypt](https://decrypt.co/feed)
- [NewsBTC](https://www.newsbtc.com/feed/)
- [Bitcoin Magazine](https://bitcoinmagazine.com/.rss/full/)
- [Bitcoin.com](https://news.bitcoin.com/feed/)

Each story is tagged to at most one coin, then classified **bullish / bearish / unclear** with keyword heuristics. **Unclear is dropped.** The page only shows `locked coin ∩ locked bias`. Links open the original publisher.

**Optional CryptoPanic:** if you have a token, set it in `.env.local` (never commit secrets):

```bash
cp .env.example .env.local
```

```
CRYPTOPANIC_AUTH_TOKEN=your_token
```

See [CryptoPanic API](https://cryptopanic.com/developers/api/). The free developer plan was discontinued in 2026; a paid token is optional. RSS still works without it.

**Fallback:** if every live source is unreachable, the API returns the sealed sample tape in `data/articles.json` (still filtered by the lock). The client uses the same sample if `/api/feed` itself is offline. The app does not crash without a key or a network.

Optional cache override:

```
NEWS_CACHE_TTL_MS=600000
```

## Product rules

- Conviction is immutable after lock. Settings shows the seal; there is no edit UI.
- Not a broker. Not a recommendation to buy or sell.
- Dark, sparse fintech UI.

```bash
npm run build
```

## Operator digest (first-party analytics)

No third-party analytics SDKs. The server keeps an append-only JSONL log so the operator can read daily visitors and account registrations in **Asia/Tokyo**.

**Log file:** `data/events.jsonl` under `process.cwd()`. Override with `NCNC_EVENTS_PATH`. If that path is not writable, the server falls back to `/tmp/ncnc-events.jsonl`. Do not commit the log.

Each line:

```json
{"ts":"2026-09-05T20:00:00.000Z","event":"signup","meta":{"sessionId":"…"}}
```

`event` is `signup`, `lock`, or `pageview`. `meta` may include an anonymous `sessionId` only. Emails, IPs, and other PII are not written.

The client stores a stable anonymous id in `localStorage` (`ncnc.sid`) and sends it with events so `/api/stats` can dedupe visitors. Mock signup success posts `signup`. A successful LOCK posts `lock`. Splash or feed posts `pageview` once per browser tab session.

### `POST /api/event`

Body: `{ "event": "signup" | "lock" | "pageview", "meta": { "sessionId": "…" } }`

Validates the event enum, appends one line, returns **204**. Light in-memory rate limit: 30 requests / minute / IP. Invalid bodies return 400.

### `GET /api/stats?day=YYYY-MM-DD`

`day` is an **Asia/Tokyo** calendar day. Omit it to get **yesterday** in Tokyo.

```json
{
  "day": "2026-09-05",
  "timezone": "Asia/Tokyo",
  "visitors": 12,
  "signups": 3,
  "locks": 2,
  "pageviews": 18
}
```

`visitors` are unique anonymous session ids that sent a `pageview` that day, plus distinct `signup` / `lock` actors (same session id, or the event itself if no id). Unique IPs from nginx are out of scope.
