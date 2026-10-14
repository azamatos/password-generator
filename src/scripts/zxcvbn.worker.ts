// Runs zxcvbn off the main thread: its dictionaries are large, and checking a long password can take a moment.
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as en from "@zxcvbn-ts/language-en";

export interface CheckRequest {
  id: number;
  password: string;
}

export interface CheckResponse {
  id: number;
  score: 0 | 1 | 2 | 3 | 4;
  guesses: number;
  warning: string | null;
  suggestions: string[];
}

const zxcvbn = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...en.dictionary },
  graphs: common.adjacencyGraphs,
  translations: en.translations,
  useLevenshteinDistance: true,
});

self.addEventListener("message", async (event: MessageEvent<CheckRequest>) => {
  const { id, password } = event.data;
  const result = await zxcvbn.checkAsync(password);
  const response: CheckResponse = {
    id,
    score: result.score,
    guesses: result.guesses,
    warning: result.feedback.warning,
    suggestions: result.feedback.suggestions,
  };
  self.postMessage(response);
});
