/** `value`, kept between `min` and `max`. */
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** How far `value` sits between `min` and `max`, as a percentage: the filled part of a slider. */
export const fillPercent = (value: number, min: number, max: number) =>
  max > min ? ((value - min) / (max - min)) * 100 : 0;
