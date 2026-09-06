import { COIN_IDS, type Bias, type CoinId, type Conviction } from "../types";

const COIN_SET = new Set<string>(COIN_IDS);
const BIASES = new Set<Bias>(["bullish", "bearish"]);

function isCoin(value: string): value is CoinId {
  return COIN_SET.has(value);
}

function isBias(value: string): value is Bias {
  return BIASES.has(value as Bias);
}

function parsePair(raw: string): Conviction | null {
  const [coinRaw, biasRaw] = raw.split(/[:.]/).map((part) => part.trim());
  const coin = coinRaw?.toUpperCase() ?? "";
  const bias = biasRaw?.toLowerCase() ?? "";
  if (!isCoin(coin) || !isBias(bias)) return null;
  return { coin, bias };
}

export function parseConvictions(search: URLSearchParams): Conviction[] {
  const pairs = [
    ...search.getAll("c"),
    ...(search.get("q")?.split(",") ?? []),
  ];

  const seen = new Set<CoinId>();
  const convictions: Conviction[] = [];

  for (const pair of pairs) {
    const parsed = parsePair(pair);
    if (!parsed || seen.has(parsed.coin)) continue;
    seen.add(parsed.coin);
    convictions.push(parsed);
  }

  return convictions;
}
