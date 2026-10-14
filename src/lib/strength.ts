export interface Strength {
  /** 1 to 4, for the meter. */
  score: 1 | 2 | 3 | 4;
  label: "Weak" | "Fair" | "Strong" | "Very strong";
}

/**
 * Label for a password whose strength is known exactly in bits (generated ones).
 * 60 bits takes about 1.8 years on average at 10 billion guesses a second; 80 bits, about 2 million years.
 */
export function strengthOf(bits: number): Strength {
  if (bits >= 80) return { score: 4, label: "Very strong" };
  if (bits >= 60) return { score: 3, label: "Strong" };
  if (bits >= 40) return { score: 2, label: "Fair" };
  return { score: 1, label: "Weak" };
}
