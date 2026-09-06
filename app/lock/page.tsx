"use client";

import { useMemo, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Guard } from "@/components/Guard";
import { Body, Button, CheckboxRow, Eyebrow, Screen, Title } from "@/components/ui";
import { coinById } from "@/lib/coins";
import { useApp } from "@/lib/session";
import type { Bias, CoinId } from "@/lib/types";

const LOCK_WORD = "LOCK";

export default function LockPage() {
  const { draftCoins, draftBias, setDraftBias, lockConviction } = useApp();
  const [hideOpposing, setHideOpposing] = useState(false);
  const [cannotChange, setCannotChange] = useState(false);
  const [typed, setTyped] = useState("");

  const allBiased = draftCoins.every((coin) => Boolean(draftBias[coin]));
  const canLock =
    allBiased && hideOpposing && cannotChange && typed === LOCK_WORD;

  function choose(coin: CoinId, bias: Bias) {
    setDraftBias(coin, bias);
  }

  const helper = useMemo(() => {
    if (!allBiased) return "Pick bullish or bearish for every coin.";
    if (!hideOpposing || !cannotChange) return "Confirm both lock conditions.";
    if (typed !== LOCK_WORD) return "Type LOCK to make it irreversible.";
    return "This cannot be edited later.";
  }, [allBiased, hideOpposing, cannotChange, typed]);

  return (
    <Guard gate="auth">
      <Screen>
        <header>
          <BrandMark />
        </header>

        <main className="flex flex-1 flex-col py-10">
          <Eyebrow>Step 2 of 2 · Permanent</Eyebrow>
          <Title>Set a bias. Then lock it.</Title>
          <Body>
            Once this is sealed, the feed only shows news that agrees with you.
            The other side is gone.
          </Body>

          <ul className="mt-8 flex flex-col gap-3">
            {draftCoins.map((coinId) => {
              const coin = coinById(coinId);
              const bias = draftBias[coinId];
              return (
                <li
                  key={coinId}
                  className="rounded-md border border-line bg-ink p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-[12px] tracking-[0.14em] text-paper">
                      {coin.ticker}
                    </p>
                    <p className="text-[12px] text-mist">{coin.name}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(["bullish", "bearish"] as const).map((option) => {
                      const active = bias === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(coinId, option)}
                          className={`h-10 rounded-md border text-[13px] capitalize transition-colors ${
                            active
                              ? "border-signal/50 bg-signal/10 text-paper"
                              : "border-line bg-void text-mist hover:text-paper"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-2.5">
            <CheckboxRow checked={hideOpposing} onChange={setHideOpposing}>
              I understand opposing news will be hidden from my feed.
            </CheckboxRow>
            <CheckboxRow checked={cannotChange} onChange={setCannotChange}>
              I understand I cannot change this bias later.
            </CheckboxRow>
          </div>

          <label className="mt-6 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
              Type LOCK
            </span>
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="LOCK"
              className="mt-2 h-12 w-full rounded-md border border-line bg-ink px-3 font-mono text-[15px] tracking-[0.28em] text-paper outline-none placeholder:text-mist/35 focus:border-signal/50"
            />
          </label>

          <div className="mt-8">
            <Button
              disabled={!canLock}
              onClick={() => {
                lockConviction();
              }}
            >
              Lock my conviction
            </Button>
            <p className="mt-3 text-center text-[12px] text-mist">{helper}</p>
          </div>
        </main>
      </Screen>
    </Guard>
  );
}
