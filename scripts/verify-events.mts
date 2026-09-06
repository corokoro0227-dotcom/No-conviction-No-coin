import {
  addCalendarDays,
  isValidDay,
  parseEventLog,
  summarizeDay,
  tokyoCalendarDay,
  yesterdayTokyo,
} from "../lib/events.ts";

let failed = 0;

function assert(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log("OK", name);
    return;
  }
  failed += 1;
  console.error("FAIL", name, detail ?? "");
}

// 2026-09-06 15:00 UTC is still 2026-09-07 00:00 in Tokyo (UTC+9).
assert(
  "tokyo day after midnight JST",
  tokyoCalendarDay(new Date("2026-09-06T15:00:00.000Z")) === "2026-09-07",
);
assert(
  "tokyo day before midnight JST",
  tokyoCalendarDay(new Date("2026-09-06T14:59:00.000Z")) === "2026-09-06",
);
assert("yesterday is previous tokyo calendar day", yesterdayTokyo(new Date("2026-09-06T15:00:00.000Z")) === "2026-09-06");
assert("calendar add crosses month", addCalendarDays("2026-09-01", -1) === "2026-08-31");
assert("valid day", isValidDay("2026-09-05"));
assert("rejects 2026-02-30", !isValidDay("2026-02-30"));
assert("rejects junk", !isValidDay("yesterday"));

const log = parseEventLog(`
{"ts":"2026-09-05T20:00:00.000Z","event":"pageview","meta":{"sessionId":"aaa","email":"x@y.z"}}
{"ts":"2026-09-05T21:00:00.000Z","event":"signup","meta":{"sessionId":"aaa"}}
{"ts":"2026-09-05T22:00:00.000Z","event":"lock","meta":{"sessionId":"aaa"}}
{"ts":"2026-09-05T23:00:00.000Z","event":"pageview","meta":{"sessionId":"bbb"}}
{"ts":"2026-09-06T16:00:00.000Z","event":"signup","meta":{"sessionId":"ccc"}}
not-json
{"ts":"2026-09-05T12:00:00.000Z","event":"nope"}
{"ts":"2026-09-05T18:00:00.000Z","event":"signup"}
`);

const tokyoDay = "2026-09-06"; // 2026-09-05 20:00Z == 2026-09-06 05:00 JST
const stats = summarizeDay(log, tokyoDay);

assert("strips pii from meta", log[0]?.meta?.sessionId === "aaa" && !("email" in (log[0]?.meta ?? {})));
assert("pageviews that tokyo day", stats.pageviews === 2, stats);
assert("signups that tokyo day", stats.signups === 2, stats);
assert("locks that tokyo day", stats.locks === 1, stats);
assert("unique visitors (aaa, bbb, anonymous signup)", stats.visitors === 3, stats);
assert("next tokyo day only has ccc signup", summarizeDay(log, "2026-09-07").signups === 1);

if (failed) {
  console.error(`\n${failed} fixture(s) failed`);
  process.exit(1);
}
console.log("\nfixtures passed");
