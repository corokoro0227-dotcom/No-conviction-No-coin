import type { CoinId } from "./types";

export const COINS: {
  id: CoinId;
  name: string;
  ticker: string;
}[] = [
  { id: "BTC", name: "Bitcoin", ticker: "BTC" },
  { id: "ETH", name: "Ethereum", ticker: "ETH" },
  { id: "SOL", name: "Solana", ticker: "SOL" },
];

export const MAX_COINS = 3;

export function coinById(id: CoinId) {
  const coin = COINS.find((item) => item.id === id);
  if (!coin) {
    throw new Error(`Unknown coin: ${id}`);
  }
  return coin;
}
