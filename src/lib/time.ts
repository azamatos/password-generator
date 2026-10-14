const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;
const UNIVERSE_AGE_YEARS = 13.8e9;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// Each unit is used until its rounded count would reach the next one, so 59.6 seconds reads "1 minute", not "60 seconds".
const UNITS: [unit: string, seconds: number, upTo: number][] = [
  ["second", 1, 60],
  ["minute", MINUTE, 60],
  ["hour", HOUR, 24],
  ["day", DAY, 30],
  ["month", MONTH, 12],
  ["year", YEAR, 1000],
];

/** "3 hours", "about 2 million years": how long a number of seconds feels. */
export function humanizeSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds / YEAR > UNIVERSE_AGE_YEARS) return "longer than the universe has existed";
  if (seconds < 1) return "less than a second";
  for (const [unit, size, upTo] of UNITS) {
    const n = Math.round(seconds / size);
    if (n < upTo) return plural(n, unit);
  }
  const years = seconds / YEAR;
  for (const [size, word] of [
    [1e3, "thousand"],
    [1e6, "million"],
  ] as const) {
    const n = Math.round(years / size);
    if (n < 1000) return `about ${n} ${word} years`;
  }
  return `about ${Math.round(years / 1e9)} billion years`;
}
