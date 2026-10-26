import { clamp, position } from "@/lib/math";
import { find } from "./dom";

interface RangeOptions {
  /** What "Reset to N" sets, within the current limits. */
  recommended: number;
  /** Called with the new value when the slider moves or "Reset to N" is pressed. */
  onChange: (value: number) => void;
}

/** Drives a RangeField (src/components/ui/RangeField.astro) inside `root`. */
export function bindRange(root: ParentNode, name: string, { recommended, onChange }: RangeOptions) {
  const field = find(root, `[data-range="${name}"]`);
  const input = find<HTMLInputElement>(field, "[data-range-input]");
  const track = find(field, "[data-range-track]");
  const value = find(field, "[data-range-value]");
  const minLabel = find(field, "[data-range-min]");
  const maxLabel = find(field, "[data-range-max]");
  const isRecommended = find(field, "[data-range-is-recommended]");
  const recommend = find<HTMLButtonElement>(field, "[data-range-recommend]");

  input.addEventListener("input", () => onChange(Number(input.value)));
  recommend.addEventListener("click", () => {
    onChange(recommended);
    // The button hides once the value is there, so focus moves to the slider instead of falling to the page.
    input.focus();
  });

  return {
    /** Shows `value` between `min` and `max`, and whether it's the recommended one. */
    set(current: number, min: number, max: number) {
      input.min = String(min);
      input.max = String(max);
      input.value = String(current);
      track.style.setProperty("--at", String(position(current, min, max)));
      value.textContent = String(current);
      minLabel.textContent = String(min);
      maxLabel.textContent = String(max);
      const target = clamp(recommended, min, max);
      isRecommended.hidden = current !== target;
      recommend.hidden = current === target;
      recommend.textContent = `Reset to ${target}`;
    },
  };
}
