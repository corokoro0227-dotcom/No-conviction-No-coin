import { classifyBias, classifyStory, detectCoin } from "../lib/news/classify.ts";

const cases: Array<[string, "bullish" | "bearish" | "unclear"]> = [
  ["Spot bitcoin ETFs absorb another $1.2B as desks extend the bid", "bullish"],
  ["ETF outflows stretch into a fourth session; liquidity thins above", "bearish"],
  ["Leverage flushed as bitcoin loses a well-watched weekly level", "bearish"],
  ["Bitcoin crashes after a weekend liquidation cascade", "bearish"],
  ["Bitcoin ETF inflows hit $731M, highest since January as BTC reclaims $80K", "bullish"],
  ["Bitcoin ETFs end 9-day inflow streak as BTC dips below $78K", "bearish"],
  ["Ether, XRP ETF inflow streaks end as Bitcoin funds rebound", "unclear"],
  ["Recovery specialists crack $1B crypto wallet... but find just $10", "unclear"],
  ["Solana outage scare premium returns after a skipped slot cluster", "bearish"],
  ["Weekly market wrap with mixed tape", "unclear"],
];

let failed = 0;
for (const [title, expected] of cases) {
  const { stance } = classifyBias(title);
  const classified = classifyStory(title, "", detectCoin(title, "BTC") ?? undefined);
  if (stance !== expected) {
    failed += 1;
    console.error("FAIL", { title, expected, stance, classified });
  } else {
    console.log("OK", expected, title);
  }
}

if (failed) {
  console.error(`\n${failed} fixture(s) failed`);
  process.exit(1);
}
console.log("\nfixtures passed");
