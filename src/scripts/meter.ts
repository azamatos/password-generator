import type { Meter } from "@/lib/strength";

/** Shows `meter` in a Meter (src/components/ui/Meter.astro): its bars, tone and level; null empties it. */
export function showMeter(root: HTMLElement, meter: Meter | null): void {
  const el = root.querySelector<HTMLElement>("[data-meter]") ?? root;
  if (meter) el.dataset.tone = meter.tone;
  else delete el.dataset.tone;
  el.querySelectorAll("[data-bars] i").forEach((bar, i) =>
    bar.classList.toggle("on", meter !== null && i < meter.bars),
  );
  el.querySelector("[data-level]")!.textContent = meter?.label ?? "—";
}
