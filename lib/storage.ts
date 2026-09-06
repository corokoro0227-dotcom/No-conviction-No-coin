import { COIN_IDS, emptyState, type AppState, type Bias, type CoinId } from "./types";

export const STORAGE_KEY = "ncnc.v1";

const BIASES = new Set<Bias>(["bullish", "bearish"]);
const COIN_SET = new Set<string>(COIN_IDS);

function isCoinId(value: unknown): value is CoinId {
  return typeof value === "string" && COIN_SET.has(value);
}

function isBias(value: unknown): value is Bias {
  return typeof value === "string" && BIASES.has(value as Bias);
}

export function parseState(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return emptyState();

  const data = raw as Partial<AppState>;
  const next = emptyState();

  if (data.session && typeof data.session === "object") {
    const provider = data.session.provider;
    if (
      provider === "email" ||
      provider === "apple" ||
      provider === "google"
    ) {
      next.session = {
        provider,
        email: typeof data.session.email === "string" ? data.session.email : undefined,
        signedInAt:
          typeof data.session.signedInAt === "string"
            ? data.session.signedInAt
            : new Date().toISOString(),
      };
    }
  }

  if (Array.isArray(data.draftCoins)) {
    next.draftCoins = data.draftCoins.filter(isCoinId).slice(0, 3);
  }

  if (data.draftBias && typeof data.draftBias === "object") {
    for (const [coin, bias] of Object.entries(data.draftBias)) {
      if (isCoinId(coin) && isBias(bias)) {
        next.draftBias[coin] = bias;
      }
    }
  }

  if (data.profile && typeof data.profile === "object") {
    const convictions = Array.isArray(data.profile.convictions)
      ? data.profile.convictions
          .filter(
            (item): item is { coin: CoinId; bias: Bias } =>
              !!item &&
              typeof item === "object" &&
              isCoinId((item as { coin?: unknown }).coin) &&
              isBias((item as { bias?: unknown }).bias),
          )
          .slice(0, 3)
      : [];

    if (convictions.length > 0) {
      next.profile = {
        lockedAt:
          typeof data.profile.lockedAt === "string"
            ? data.profile.lockedAt
            : new Date().toISOString(),
        convictions,
      };
    }
  }

  return next;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return parseState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
