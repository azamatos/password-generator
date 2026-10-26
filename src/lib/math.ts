/** `value`, kept between `min` and `max`. */
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** How far `value` sits between `min` and `max`, from 0 to 1: where a slider's thumb is. */
export const position = (value: number, min: number, max: number) => (max > min ? (value - min) / (max - min) : 0);
