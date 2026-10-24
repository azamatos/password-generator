// Runs zxcvbn off the main thread: its dictionaries are large, and checking a long password can take a moment.
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as en from "@zxcvbn-ts/language-en";

export interface CheckRequest {
  id: number;
  password: string;
}

export interface CheckResult {
  id: number;
  score: 0 | 1 | 2 | 3 | 4;
  guesses: number;
  warning: string | null;
  suggestions: string[];
}

export type CheckResponse = CheckResult | { id: number; failed: true };

const zxcvbn = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...en.dictionary },
  graphs: common.adjacencyGraphs,
  translations: en.translations,
  useLevenshteinDistance: true,
});

self.addEventListener("message", async (event: MessageEvent<CheckRequest>) => {
  const { id, password } = event.data;
  let response: CheckResponse;
  try {
    const result = await zxcvbn.checkAsync(password);
    response = {
      id,
      score: result.score,
      guesses: result.guesses,
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions,
    };
  } catch {
    // An error thrown in here never reaches the page, which would wait for an answer forever.
    response = { id, failed: true };
  }
  self.postMessage(response);
});
