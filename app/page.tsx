"use client";

import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Guard } from "@/components/Guard";
import { Body, Button, Screen } from "@/components/ui";
import { DISCLAIMER, SPLASH_BODY } from "@/lib/copy";

export default function SplashPage() {
  const router = useRouter();

  return (
    <Guard gate="public">
      <Screen>
        <header className="flex items-center justify-between">
          <BrandMark />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
            US / EU
          </p>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16 sm:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
            No conviction. No coin.
          </p>
          <h1 className="mt-5 max-w-[12ch] text-[2.6rem] font-semibold leading-[0.95] tracking-[-0.045em] text-paper sm:text-[4rem]">
            Lock a bias. Starve the noise.
          </h1>
          <Body>{SPLASH_BODY}</Body>

          <div className="mt-10 max-w-sm">
            <Button onClick={() => router.push("/signup")}>Begin</Button>
            <p className="mt-3 text-center text-[12px] text-mist">
              Not financial advice. Not a broker.
            </p>
          </div>
        </main>

        <footer className="border-t border-line pt-5 text-[11px] leading-relaxed text-mist">
          {DISCLAIMER}
        </footer>
      </Screen>
    </Guard>
  );
}
