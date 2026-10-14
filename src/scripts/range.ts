import { clamp, fillPercent } from "@/lib/math";
import { find } from "./dom";

interface RangeOptions {
  /** What the "recommended" button sets, within the current limits. */
  recommended: number;
  /** Called with the new value when the slider moves or "recommended" is pressed. */
  onChange: (value: number) => void;
}

/** Drives a RangeField (src/components/ui/RangeField.astro) inside `root`. */
export function bindRange(root: ParentNode, name: string, { recommended, onChange }: RangeOptions) {
  const field = find(root, `[data-range="${name}"]`);
  const input = find<HTMLInputElement>(field, "[data-range-input]");
  const output = find<HTMLOutputElement>(field, "[data-range-value]");
  const minLabel = find(field, "[data-range-min]");
  const maxLabel = find(field, "[data-range-max]");
  const recommend = find<HTMLButtonElement>(field, "[data-range-recommend]");

  input.addEventListener("input", () => onChange(Number(input.value)));
  recommend.addEventListener("click", () => onChange(recommended));

  return {
    /** Shows `value` between `min` and `max`; "recommended" is disabled when it's already there. */
    set(value: number, min: number, max: number) {
      input.min = String(min);
      input.max = String(max);
      input.value = String(value);
      input.style.setProperty("--pct", `${fillPercent(value, min, max)}%`);
      output.value = String(value);
      minLabel.textContent = String(min);
      maxLabel.textContent = String(max);
      recommend.disabled = value === clamp(recommended, min, max);
    },
  };
}
