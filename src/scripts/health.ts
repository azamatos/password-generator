// The /health page: zxcvbn's estimate from a worker, then a leak check once typing pauses.
import { pwnedCount, sha1Hex } from "@/lib/hibp";
import { meterForScore } from "@/lib/strength";
import { humanizeSeconds } from "@/lib/time";
import { find, mount } from "./dom";
import { showMeter } from "./meter";
import type { CheckRequest, CheckResponse, CheckResult } from "./zxcvbn.worker";

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, (r: CheckResponse) => void>();
// In memory like the generator's choices: turning the leak check off holds until the tab closes.
let leakCheckOn = true;

/** zxcvbn's verdict for a password, or null when it failed. The worker and its word lists load on the first call. */
function analyse(password: string): Promise<CheckResult | null> {
  if (!worker) {
    worker = new Worker(new URL("./zxcvbn.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<CheckResponse>) => {
      pending.get(e.data.id)?.(e.data);
      pending.delete(e.data.id);
    };
    // The worker didn't load (offline, or a tab opened before a deploy). Answer everyone waiting, and start a new
    // worker on the next call.
    worker.onerror = () => {
      worker?.terminate();
      worker = undefined;
      for (const [id, resolve] of pending) resolve({ id, failed: true });
      pending.clear();
    };
  }
  const id = ++nextId;
  return new Promise((resolve) => {
    pending.set(id, (r) => resolve("failed" in r ? null : r));
    worker!.postMessage({ id, password } satisfies CheckRequest);
  });
}

type LeakState = "none" | "checking" | "clean" | "leaked" | "error" | "off";

const LEAK_TEXT: Record<Exclude<LeakState, "leaked">, [title: string, text: string]> = {
  none: ["Leak check is on", "Your password is compared with Have I Been Pwned’s list of leaked passwords."],
  checking: ["Checking known leaks…", "Only the first 5 characters of the password’s hash are sent."],
  clean: ["Not found in known leaks", "Have I Been Pwned has no record of this password."],
  error: [
    "Couldn’t check for leaks",
    "You may be offline, or Have I Been Pwned isn’t answering. Nothing else was sent.",
  ],
  off: ["Leak check is off", "Nothing leaves your browser. Turn it on to look for this password in known leaks."],
};

/** "~10⁷ guesses", with the exponent raised. */
function guessesText(guesses: number): (string | HTMLElement)[] {
  const power = document.createElement("sup");
  power.textContent = String(Math.round(Math.log10(Math.max(guesses, 1))));
  return ["~10", power, " guesses"];
}

mount("[data-health]", (root) => {
  const input = find<HTMLInputElement>(root, "[data-input]");
  const toggle = find<HTMLButtonElement>(root, "[data-toggle]");
  const clear = find<HTMLButtonElement>(root, "[data-clear]");
  const optIn = find<HTMLInputElement>(root, "[data-leak-opt-in]");
  const idle = find(root, "[data-idle]");
  const loading = find(root, "[data-loading]");
  const failed = find(root, "[data-failed]");
  const verdict = find(root, "[data-verdict]");
  const details = find(verdict, "[data-details]");
  const announce = find(root, "[data-announce]");
  const times = find(root, "[data-times]");
  const online = find(root, "[data-online]");
  const offline = find(root, "[data-offline]");
  const empty = find(root, "[data-empty-note]");
  const advice = find(root, "[data-advice]");
  const warning = find(root, "[data-warning]");
  const suggestions = find<HTMLUListElement>(root, "[data-suggestions]");
  const stronger = find(root, "[data-stronger]");
  const strongerLink = find(root, "[data-stronger-link]");
  const leak = find(root, "[data-leak]");
  const leakTitle = find(root, "[data-leak-title]");
  const leakText = find(root, "[data-leak-text]");
  const retry = find<HTMLButtonElement>(root, "[data-leak-retry]");
  const hash = find(root, "[data-hash]");
  const hashSent = find(root, "[data-hash-sent]");
  const hashKept = find(root, "[data-hash-kept]");
  const legendOn = find(root, "[data-legend-on]");
  const legendOff = find(root, "[data-legend-off]");

  /** Which input the results belong to; older answers are dropped. */
  let latest = 0;
  /** zxcvbn's score for the latest input, once it's known. */
  let score: CheckResult["score"] | null = null;
  /** Whether the latest input was found in breaches. */
  let leaked = false;
  let leakTimer = 0;
  let leakAbort: AbortController | undefined;
  /** The latest input's SHA-1, shown as what's sent and what stays. */
  let fullHash = "";

  const showLeak = (state: LeakState, count = 0) => {
    leak.dataset.state = state;
    const [title, text] =
      state === "leaked"
        ? [
            `Found in ${count.toLocaleString("en")} leaks`,
            "Leaked passwords are tried first. Don’t use this one anywhere.",
          ]
        : LEAK_TEXT[state];
    leakTitle.textContent = title;
    leakText.textContent = text;
    retry.hidden = state !== "error";
    // Only the first 5 characters are ever sent; the rest stays masked unless the password itself is shown.
    const sends = optIn.checked && state !== "error";
    hash.toggleAttribute("data-off", !sends);
    legendOn.hidden = !sends;
    legendOff.hidden = sends;
    const shown = input.type === "text";
    hashSent.textContent = fullHash ? fullHash.slice(0, 5) : "•••••";
    hashKept.textContent = fullHash && shown ? fullHash.slice(5) : "•".repeat(35);
  };

  // A leaked password is guessed first, however random it looks, so a leak overrides zxcvbn's score.
  const showVerdict = (news = "") => {
    if (score === null) return;
    const meter = meterForScore(leaked ? 0 : score);
    showMeter(verdict, meter);
    const weak = meter.tone !== "good";
    stronger.hidden = false;
    strongerLink.classList.toggle("brand", weak);
    strongerLink.classList.toggle("soft", !weak);
    // Screen readers hear the level and the leak result, not the whole panel on every keystroke.
    announce.textContent = news ? `${meter.label}. ${news}` : meter.label;
  };

  optIn.checked = leakCheckOn;

  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    showLeak(leak.dataset.state as LeakState, Number(leak.dataset.count ?? 0));
  });

  async function checkLeak(password: string, run: number) {
    leakAbort?.abort();
    leaked = false;
    if (!password) return;
    if (!optIn.checked) {
      showLeak("off");
      showVerdict();
      return;
    }
    leakAbort = new AbortController();
    showLeak("checking");
    try {
      const count = await pwnedCount(password, leakAbort.signal);
      if (run !== latest) return;
      leaked = count > 0;
      leak.dataset.count = String(count);
      showLeak(count ? "leaked" : "clean", count);
      showVerdict(`${leakTitle.textContent}.`);
    } catch (error) {
      if ((error as Error).name === "AbortError" || run !== latest) return;
      showLeak("error");
      showVerdict(`${leakTitle.textContent}.`);
    }
  }

  function reset() {
    times.toggleAttribute("data-blank", true);
    online.textContent = offline.textContent = "—";
    empty.hidden = false;
    advice.hidden = stronger.hidden = true;
  }

  async function update() {
    const password = input.value;
    const run = ++latest;
    score = null;
    leaked = false;
    clearTimeout(leakTimer);
    leakAbort?.abort();
    clear.hidden = !password;
    failed.hidden = verdict.hidden = loading.hidden = true;
    idle.hidden = Boolean(password);
    fullHash = password ? await sha1Hex(password) : "";
    if (run !== latest) return;
    showLeak(password && !optIn.checked ? "off" : "none");
    if (!password) {
      reset();
      announce.textContent = "";
      return;
    }

    if (!worker) loading.hidden = false;
    const r = await analyse(password);
    if (run !== latest) return;
    loading.hidden = true;
    if (!r) {
      reset();
      failed.hidden = false;
      announce.textContent = failed.textContent!.trim();
      return;
    }

    verdict.hidden = false;
    score = r.score;
    showVerdict();
    details.replaceChildren(`${[...password].length} characters · `, ...guessesText(r.guesses));
    times.removeAttribute("data-blank");
    online.textContent = humanizeSeconds(r.guesses / 10);
    // A leaked database with a slow hash such as bcrypt, the case zxcvbn's estimates are made for.
    offline.textContent = humanizeSeconds(r.guesses / 1e4);
    empty.hidden = true;
    // zxcvbn's warning when it has one; suggestions alone mean it could be stronger; neither means it found nothing.
    const fine = !r.warning && (r.suggestions.length === 0 || r.score >= 3);
    advice.hidden = false;
    advice.toggleAttribute("data-fine", fine);
    warning.textContent = r.warning ?? (fine ? "No common patterns found" : "It could be stronger");
    suggestions.replaceChildren(
      ...(fine ? [] : r.suggestions).map((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        return li;
      }),
    );
    // Wait for a pause in typing, so the leak check doesn't run on every keystroke.
    leakTimer = window.setTimeout(() => checkLeak(password, run), 600);
  }

  input.addEventListener("input", () => void update());
  // Typing, pasting or autofill before this script loaded fired no input event, so check what's there now.
  if (input.value) void update();
  optIn.addEventListener("change", () => {
    leakCheckOn = optIn.checked;
    // Check now rather than after the typing pause, and only once.
    clearTimeout(leakTimer);
    if (score !== null) void checkLeak(input.value, latest);
    else showLeak(input.value && !optIn.checked ? "off" : "none");
  });
  retry.addEventListener("click", () => void checkLeak(input.value, latest));
  clear.addEventListener("click", () => {
    input.value = "";
    void update();
    input.focus();
  });
});
