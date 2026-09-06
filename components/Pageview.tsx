"use client";

import { useEffect } from "react";
import { trackPageviewOnce } from "@/lib/telemetry";

export function Pageview() {
  useEffect(() => {
    trackPageviewOnce();
  }, []);
  return null;
}
