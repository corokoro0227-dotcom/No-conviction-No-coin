"use client";

import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Guard } from "@/components/Guard";
import { Body, Button, Eyebrow, Screen, Title } from "@/components/ui";
import { DISCLAIMER } from "@/lib/copy";
import { useApp } from "@/lib/session";

export default function SignupPage() {
  const { signIn } = useApp();
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");

  function continueWith(provider: "email" | "apple" | "google", value?: string) {
    signIn(provider, value);
  }

  return (
    <Guard gate="public">
      <Screen>
        <header>
          <BrandMark href="/" />
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <Eyebrow>Create a local session</Eyebrow>
          <Title>Sign up. Then lock a view.</Title>
          <Body>
            Mock auth only — Email, Apple, or Google starts a session on this
            device. Credentials stay local.
          </Body>

          <div className="mt-8 flex flex-col gap-2.5">
            {emailOpen ? (
              <form
                className="rounded-md border border-line bg-ink p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!email.trim()) return;
                  continueWith("email", email);
                }}
              >
                <label
                  htmlFor="email"
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@domain.com"
                  className="mt-2 h-11 w-full rounded-md border border-line bg-void px-3 text-[14px] text-paper outline-none placeholder:text-mist/60 focus:border-signal/50"
                />
                <Button type="submit" className="mt-3">
                  Continue with email
                </Button>
              </form>
            ) : (
              <Button onClick={() => setEmailOpen(true)}>Continue with email</Button>
            )}

            <Button variant="secondary" onClick={() => continueWith("apple")}>
              Continue with Apple
            </Button>
            <Button variant="secondary" onClick={() => continueWith("google")}>
              Continue with Google
            </Button>
          </div>

          <p className="mt-8 text-[13px] font-medium text-paper">
            Not financial advice.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-mist">{DISCLAIMER}</p>
        </main>
      </Screen>
    </Guard>
  );
}
