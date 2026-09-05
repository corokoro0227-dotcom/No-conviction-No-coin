"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { MAX_COINS } from "./coins";
import { clearState, loadState, saveState } from "./storage";
import {
  emptyState,
  type AppState,
  type AuthProvider,
  type Bias,
  type CoinId,
  type Conviction,
} from "./types";

type AppContextValue = AppState & {
  ready: boolean;
  signIn: (provider: AuthProvider, email?: string) => void;
  setDraftCoins: (coins: CoinId[]) => void;
  setDraftBias: (coin: CoinId, bias: Bias) => void;
  lockConviction: () => boolean;
  signOut: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const SERVER_STATE = emptyState();
let memory = emptyState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readClient(): AppState {
  if (!hydrated) {
    memory = loadState();
    hydrated = true;
  }
  return memory;
}

function getServerSnapshot(): AppState {
  return SERVER_STATE;
}

function write(next: AppState) {
  memory = next;
  saveState(next);
  emit();
}

function update(recipe: (current: AppState) => AppState) {
  write(recipe(readClient()));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, readClient, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const signIn = useCallback((provider: AuthProvider, email?: string) => {
    update((current) => ({
      ...current,
      session: {
        provider,
        email: email?.trim() || undefined,
        signedInAt: new Date().toISOString(),
      },
    }));
  }, []);

  const setDraftCoins = useCallback((coins: CoinId[]) => {
    const unique = [...new Set(coins)].slice(0, MAX_COINS);
    update((current) => {
      if (current.profile) return current;
      const draftBias = { ...current.draftBias };
      for (const coin of Object.keys(draftBias) as CoinId[]) {
        if (!unique.includes(coin)) {
          delete draftBias[coin];
        }
      }
      return { ...current, draftCoins: unique, draftBias };
    });
  }, []);

  const setDraftBias = useCallback((coin: CoinId, bias: Bias) => {
    update((current) => {
      if (current.profile) return current;
      return {
        ...current,
        draftBias: { ...current.draftBias, [coin]: bias },
      };
    });
  }, []);

  const lockConviction = useCallback(() => {
    const current = readClient();
    if (current.profile || !current.session) return false;

    const convictions: Conviction[] = current.draftCoins
      .map((coin) => {
        const bias = current.draftBias[coin];
        return bias ? { coin, bias } : null;
      })
      .filter((item): item is Conviction => item !== null);

    if (convictions.length === 0 || convictions.length !== current.draftCoins.length) {
      return false;
    }

    update((latest) => {
      if (latest.profile || !latest.session) return latest;
      return {
        ...latest,
        profile: {
          lockedAt: new Date().toISOString(),
          convictions,
        },
      };
    });
    return true;
  }, []);

  const signOut = useCallback(() => {
    hydrated = true;
    clearState();
    write(emptyState());
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      signIn,
      setDraftCoins,
      setDraftBias,
      lockConviction,
      signOut,
    }),
    [state, ready, signIn, setDraftCoins, setDraftBias, lockConviction, signOut],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

export function nextOnboardingPath(
  state: Pick<AppState, "session" | "draftCoins" | "profile">,
) {
  if (state.profile) return "/feed";
  if (!state.session) return "/";
  if (state.draftCoins.length === 0) return "/coins";
  return "/lock";
}
