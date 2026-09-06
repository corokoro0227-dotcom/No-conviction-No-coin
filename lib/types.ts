export const COIN_IDS = ["BTC", "ETH", "SOL"] as const;
export type CoinId = (typeof COIN_IDS)[number];

export type Bias = "bullish" | "bearish";
export type AuthProvider = "email" | "apple" | "google";

export type Conviction = {
  coin: CoinId;
  bias: Bias;
};

export type Session = {
  provider: AuthProvider;
  email?: string;
  signedInAt: string;
};

export type LockedProfile = {
  lockedAt: string;
  convictions: Conviction[];
};

export type AppState = {
  session: Session | null;
  draftCoins: CoinId[];
  draftBias: Partial<Record<CoinId, Bias>>;
  profile: LockedProfile | null;
};

export type Article = {
  id: string;
  coin: CoinId;
  bias: Bias;
  headline: string;
  source: string;
  publishedAt: string;
  match: number;
  url: string;
};

export const emptyState = (): AppState => ({
  session: null,
  draftCoins: [],
  draftBias: {},
  profile: null,
});
