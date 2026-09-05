"use client";

import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Guard } from "@/components/Guard";
import { Body, Button, Eyebrow, Screen, Title } from "@/components/ui";
import { COINS, MAX_COINS } from "@/lib/coins";
import { useApp } from "@/lib/session";
import type { CoinId } from "@/lib/types";

export default function CoinsPage() {
  const router = useRouter();
  const { draftCoins, setDraftCoins } = useApp();

  function toggle(id: CoinId) {
    if (draftCoins.includes(id)) {
      setDraftCoins(draftCoins.filter((coin) => coin !== id));
      return;
    }
    if (draftCoins.length >= MAX_COINS) return;
    setDraftCoins([...draftCoins, id]);
  }

  return (
    <Guard gate="auth">
      <Screen>
        <header className="flex items-center justify-between">
          <BrandMark />
          <p className="font-mono text-[11px] text-mist">
            {draftCoins.length}/{MAX_COINS}
          </p>
        </header>

        <main className="flex flex-1 flex-col py-10">
          <Eyebrow>Step 1 of 2</Eyebrow>
          <Title>Choose what you’re willing to hold a view on.</Title>
          <Body>
            Bitcoin, ether, solana. Three names. Pick only the ones you will
            actually stand behind.
          </Body>

          <ul className="mt-8 flex flex-col gap-2.5">
            {COINS.map((coin) => {
              const selected = draftCoins.includes(coin.id);
              return (
                <li key={coin.id}>
                  <button
                    type="button"
                    onClick={() => toggle(coin.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-4 py-4 text-left transition-colors ${
                      selected
                        ? "border-signal/50 bg-signal/10"
                        : "border-line bg-ink hover:border-paper/15"
                    }`}
                  >
                    <span>
                      <span className="block font-mono text-[12px] tracking-[0.14em] text-paper">
                        {coin.ticker}
                      </span>
                      <span className="mt-1 block text-[13px] text-mist">{coin.name}</span>
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                        selected ? "text-signal" : "text-mist"
                      }`}
                    >
                      {selected ? "Selected" : "Add"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-10">
            <Button
              disabled={draftCoins.length === 0}
              onClick={() => router.push("/lock")}
            >
              Set a bias
            </Button>
          </div>
        </main>
      </Screen>
    </Guard>
  );
}
