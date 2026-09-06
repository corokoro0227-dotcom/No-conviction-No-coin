import type { Bias, CoinId } from "../types";

export type Stance = Bias | "unclear";

export type ClassifiedNews = {
  coin: CoinId;
  bias: Bias;
  match: number;
};

const COIN_PATTERNS: Record<CoinId, RegExp[]> = {
  BTC: [/\bbitcoin\b/i, /\bbtc\b/i, /\$btc\b/i, /\bwbtc\b/i, /\bibit\b/i],
  ETH: [/\bethereum\b/i, /\bether\b/i, /\beth\b/i, /\$eth\b/i, /\bsteth\b/i, /\bweth\b/i],
  SOL: [/\bsolana\b/i, /\$sol\b/i, /\bsol\b/i],
};

const REVERSALS: Array<[RegExp, Bias, number]> = [
  [/\b(?:end|ends|ended|ending)\b[\s\S]{0,48}\binflows?\b/i, "bearish", 3],
  [/\binflows?\b[\s\S]{0,24}\b(?:end|ends|ended|ending|halt|stop|stall)/i, "bearish", 3],
  [/\bstreaks?\s+end\b/i, "bearish", 2],
  [/\bno outflows?\b/i, "bullish", 2],
];

const BULLISH: Array<[RegExp, number]> = [
  [/\ball[- ]time highs?\b/i, 3],
  [/\brecord highs?\b/i, 3],
  [/\betf approvals?\b/i, 3],
  [/\betf approved\b/i, 3],
  [/\b(?:sec|regulator(?:y)?).{0,24}approv/i, 3],
  [/\bapprov(?:ed|al|es).{0,24}etf\b/i, 3],
  [/\betf inflows?\b/i, 3],
  [/\bspot etfs?\b/i, 2],
  [/\binstitutional (?:buying|inflows?|adoption)\b/i, 3],
  [/\btreasury (?:buy|buys|buying|purchase)\b/i, 3],
  [/\baccumulat(?:e|es|ed|ion|ing)\b/i, 2],
  [/\bbreak(?:s|ing)? out\b/i, 2],
  [/\bbreakout\b/i, 2],
  [/\bnew highs?\b/i, 2],
  [/\bsupply shock\b/i, 2],
  [/\bbullish\b/i, 2],
  [/\binflows?\b/i, 2],
  [/\babsorb(?:s|ed|ing)?\b/i, 2],
  [/\bsurge(?:s|d)?\b/i, 2],
  [/\bsoar(?:s|ed|ing)?\b/i, 2],
  [/\brally\b|\brallies\b|\brallied\b/i, 2],
  [/\brebound(?:s|ed|ing)?\b/i, 2],
  [/\breclaim(?:s|ed|ing)?\b/i, 2],
  [/\badoption\b/i, 2],
  [/\bgreenlight(?:ed)?\b/i, 2],
  [/\bextend(?:s|ed|ing)? the bid\b/i, 2],
];

const BEARISH: Array<[RegExp, number]> = [
  [/\betf outflows?\b/i, 3],
  [/\ball[- ]time lows?\b/i, 3],
  [/\brecord lows?\b/i, 3],
  [/\bleverage flush(?:ed)?\b/i, 3],
  [/\bliquidations?\b/i, 3],
  [/\bsell[- ]offs?\b/i, 3],
  [/\brisk[- ]off\b/i, 2],
  [/\bhack(?:ed|s|ing)?\b/i, 3],
  [/\bexploit(?:ed|s|ation)?\b/i, 3],
  [/\bbreach(?:ed|es)?\b/i, 2],
  [/\bdrained\b/i, 2],
  [/\blawsuit\b|\bsued\b|\bindictment\b/i, 3],
  [/\bsec charges\b/i, 3],
  [/\binvestigation\b/i, 2],
  [/\bcrackdown\b/i, 3],
  [/\bban(?:ned|s)?\b/i, 2],
  [/\bbearish\b/i, 2],
  [/\boutflows?\b/i, 2],
  [/\bcrash(?:es|ed|ing)?\b/i, 3],
  [/\bplunge(?:s|d|ing)?\b/i, 3],
  [/\bdump(?:s|ed|ing)?\b/i, 2],
  [/\bslump(?:s|ed|ing)?\b/i, 2],
  [/\btumbl(?:e|es|ed|ing)\b/i, 2],
  [/\bcollapse(?:s|d|ing)?\b/i, 3],
  [/\boutage\b/i, 3],
  [/\bhalt(?:ed|s)?\b/i, 2],
  [/\bunplug(?:s|ged)?\b/i, 2],
  [/\bdowntime\b/i, 2],
  [/\bfraud\b|\bponzi\b/i, 3],
  [/\bbreakdown\b/i, 2],
  [/\brejection\b|\brejects\b/i, 2],
  [/\bvalidator exits?\b/i, 2],
  [/\bcapitulation\b/i, 3],
  [/\bdelist(?:ed|ing)?\b/i, 3],
  [/\bdip(?:s|ped|ping)?\b/i, 2],
  [/\bflush(?:ed)?\b/i, 2],
  [/\bloses?\b|\blost\b/i, 1],
  [/\bfall(?:s|ing)?\b|\bfell\b/i, 1],
  [/\bdrop(?:s|ped|ping)?\b/i, 2],
  [/\bdecline(?:s|d|ing)?\b/i, 1],
];

function countMentions(text: string, patterns: RegExp[]): number {
  let total = 0;
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matches = text.match(new RegExp(pattern.source, flags));
    total += matches?.length ?? 0;
  }
  return total;
}

export function detectCoin(text: string, hint?: CoinId): CoinId | null {
  const counts = (Object.keys(COIN_PATTERNS) as CoinId[]).map((coin) => ({
    coin,
    count: countMentions(text, COIN_PATTERNS[coin]),
  }));
  const mentioned = counts
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  if (mentioned.length === 0) return hint ?? null;
  if (mentioned.length === 1) return mentioned[0].coin;
  if (mentioned[0].count > mentioned[1].count) return mentioned[0].coin;
  if (hint && mentioned.some((item) => item.coin === hint)) return hint;
  return null;
}

function score(text: string, lexicon: Array<[RegExp, number]>): number {
  let total = 0;
  for (const [pattern, weight] of lexicon) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matches = text.match(new RegExp(pattern.source, flags));
    if (matches) total += matches.length * weight;
  }
  return total;
}

function neutralize(text: string): string {
  return text
    .replace(
      /\b(?:not|no|without|despite)\s+(?:a\s+)?(?:crash|dump|plunge|outflows?|hack|ban|outage|sell[- ]off)\b/gi,
      " ",
    )
    .replace(/\bdrops?\s+opposition\b/gi, " ")
    .replace(/\bdismiss(?:es|ed|ing)?\b[\s\S]{0,40}\blawsuit\b/gi, " ");
}

function applyReversals(text: string): { text: string; bull: number; bear: number } {
  let bull = 0;
  let bear = 0;
  let next = text;
  for (const [pattern, stance, weight] of REVERSALS) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    if (!re.test(next)) continue;
    if (stance === "bullish") bull += weight;
    else bear += weight;
    next = next.replace(new RegExp(pattern.source, flags), " ");
  }
  return { text: next, bull, bear };
}

export function classifyBias(title: string): { stance: Stance; match: number } {
  const reversed = applyReversals(neutralize(title));
  const bull = reversed.bull + score(reversed.text, BULLISH);
  const bear = reversed.bear + score(reversed.text, BEARISH);

  if (bull === 0 && bear === 0) return { stance: "unclear", match: 0 };
  if (bull > 0 && bear > 0) {
    if (bull >= bear + 2) {
      return { stance: "bullish", match: matchFromScore(bull, bear) };
    }
    if (bear >= bull + 2) {
      return { stance: "bearish", match: matchFromScore(bear, bull) };
    }
    return { stance: "unclear", match: 0 };
  }
  if (bull >= 2 && bear === 0) {
    return { stance: "bullish", match: matchFromScore(bull, 0) };
  }
  if (bear >= 2 && bull === 0) {
    return { stance: "bearish", match: matchFromScore(bear, 0) };
  }
  return { stance: "unclear", match: 0 };
}

function matchFromScore(winner: number, loser: number): number {
  const strength = winner + Math.max(0, winner - loser);
  return Math.max(70, Math.min(95, 68 + strength * 4));
}

export function classifyStory(
  title: string,
  summary = "",
  hint?: CoinId,
): ClassifiedNews | null {
  const coin = detectCoin(`${title} ${summary}`, hint);
  if (!coin) return null;

  const { stance, match } = classifyBias(title);
  if (stance === "unclear") return null;

  return { coin, bias: stance, match };
}
