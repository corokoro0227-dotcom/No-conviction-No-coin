"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Guard } from "@/components/Guard";
import { Button, Eyebrow, Screen, Title } from "@/components/ui";
import { coinById } from "@/lib/coins";
import { DISCLAIMER } from "@/lib/copy";
import { formatLockedDate } from "@/lib/format";
import { useApp } from "@/lib/session";

export default function SettingsPage() {
  const { profile, signOut } = useApp();

  return (
    <Guard gate="locked">
      <Screen>
        <header className="flex items-center justify-between">
          <BrandMark href="/feed" />
          <Link
            href="/feed"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist hover:text-paper"
          >
            Feed
          </Link>
        </header>

        <main className="flex flex-1 flex-col py-10">
          <Eyebrow>Account</Eyebrow>
          <Title>Locked. Not editable.</Title>

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {profile?.convictions.map((item) => (
              <li key={item.coin} className="flex items-center justify-between py-4">
                <span>
                  <span className="block font-mono text-[12px] tracking-[0.14em] text-paper">
                    {coinById(item.coin).ticker}
                  </span>
                  <span className="mt-1 block text-[12px] text-mist">
                    {coinById(item.coin).name}
                  </span>
                </span>
                <span className="rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
                  {item.bias}
                </span>
              </li>
            ))}
          </ul>

          {profile ? (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
              Sealed {formatLockedDate(profile.lockedAt)}
            </p>
          ) : null}

          <div className="mt-10 rounded-md border border-line bg-ink p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
              Disclaimer
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-paper/85">
              {DISCLAIMER}
            </p>
          </div>

          <div className="mt-auto pt-10">
            <Button
              variant="secondary"
              onClick={() => {
                signOut();
              }}
            >
              Log out
            </Button>
            <p className="mt-3 text-center text-[12px] text-mist">
              Logout clears this device. Bias cannot be changed without starting over.
            </p>
          </div>
        </main>
      </Screen>
    </Guard>
  );
}
