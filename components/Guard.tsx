"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { nextOnboardingPath, useApp } from "@/lib/session";

export function BootScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-1.5 w-1.5 rounded-full bg-signal" />
    </div>
  );
}

type Gate = "public" | "auth" | "locked";

export function Guard({
  gate,
  children,
}: {
  gate: Gate;
  children: React.ReactNode;
}) {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!app.ready) return;

    const destination = nextOnboardingPath(app);

    if (gate === "public") {
      if (app.session && pathname === "/") {
        router.replace(destination);
      }
      if (app.session && pathname === "/signup") {
        router.replace(destination);
      }
      return;
    }

    if (gate === "auth") {
      if (!app.session) {
        router.replace("/signup");
        return;
      }
      if (app.profile) {
        router.replace("/feed");
        return;
      }
      if (pathname === "/lock" && app.draftCoins.length === 0) {
        router.replace("/coins");
      }
      return;
    }

    if (!app.profile) {
      router.replace(destination);
    }
  }, [app, gate, pathname, router]);

  if (!app.ready) return <BootScreen />;

  if (gate === "public") {
    if (app.session && (pathname === "/" || pathname === "/signup")) {
      return <BootScreen />;
    }
    return children;
  }

  if (gate === "auth") {
    if (!app.session || app.profile) return <BootScreen />;
    if (pathname === "/lock" && app.draftCoins.length === 0) return <BootScreen />;
    return children;
  }

  if (!app.profile) return <BootScreen />;
  return children;
}
