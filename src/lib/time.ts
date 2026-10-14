const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;
const UNIVERSE_AGE_YEARS = 13.8e9;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** "3 hours", "about 2 million years": how long a number of seconds feels. */
export function humanizeSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds / YEAR > UNIVERSE_AGE_YEARS) return "longer than the universe has existed";
  if (seconds < 1) return "less than a second";
  if (seconds < MINUTE) return plural(Math.round(seconds), "second");
  if (seconds < HOUR) return plural(Math.round(seconds / MINUTE), "minute");
  if (seconds < DAY) return plural(Math.round(seconds / HOUR), "hour");
  if (seconds < MONTH) return plural(Math.round(seconds / DAY), "day");
  if (seconds < YEAR) return plural(Math.round(seconds / MONTH), "month");
  const years = seconds / YEAR;
  if (years < 1000) return plural(Math.round(years), "year");
  for (const [size, word] of [
    [1e9, "billion"],
    [1e6, "million"],
    [1e3, "thousand"],
  ] as const) {
    if (years >= size) return `about ${Math.round(years / size)} ${word} years`;
  }
  return plural(Math.round(years), "year");
}
