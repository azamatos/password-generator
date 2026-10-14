import type { Meter } from "@/lib/strength";

/** Fills the first `meter.bars` bars of a StrengthBars element, in the meter's tone. */
export function showMeter(bars: HTMLElement, meter: Meter): void {
  bars.dataset.tone = meter.tone;
  [...bars.children].forEach((bar, i) => bar.classList.toggle("on", i < meter.bars));
}
