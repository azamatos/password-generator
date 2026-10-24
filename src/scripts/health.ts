// The /health page: zxcvbn's estimate from a worker, then a leak check once typing pauses.
import { pwnedCount } from "@/lib/hibp";
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

mount("[data-health]", (root) => {
  const input = find<HTMLInputElement>(root, "[data-input]");
  const toggle = find<HTMLButtonElement>(root, "[data-toggle]");
  const optIn = find<HTMLInputElement>(root, "[data-leak-opt-in]");
  const loading = find(root, "[data-loading]");
  const failed = find(root, "[data-failed]");
  const announce = find(root, "[data-announce]");
  const results = find(root, "[data-results]");
  const bars = find(root, "[data-bars]");
  const verdict = find(root, "[data-verdict]");
  const leakChip = find(root, "[data-leak-chip]");
  const online = find(root, "[data-online]");
  const offline = find(root, "[data-offline]");
  const leak = find(root, "[data-leak]");
  const warning = find(root, "[data-warning]");
  const suggestions = find<HTMLUListElement>(root, "[data-suggestions]");

  /** Which input the results belong to; older answers are dropped. */
  let latest = 0;
  /** zxcvbn's score for the latest input, once it's known. */
  let score: CheckResult["score"] | null = null;
  /** Whether the latest input was found in breaches. */
  let leaked = false;
  let leakTimer = 0;
  let leakAbort: AbortController | undefined;

  // A leaked password is guessed first, however random it looks, so a leak overrides zxcvbn's score.
  const showVerdict = (news = "") => {
    if (score === null) return;
    const meter = meterForScore(leaked ? 0 : score);
    showMeter(bars, meter);
    verdict.textContent = meter.label;
    // Screen readers hear the level and the leak result, not the whole panel on every keystroke.
    announce.textContent = news ? `${meter.label}. ${news}` : meter.label;
  };

  optIn.checked = leakCheckOn;

  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    // Same label, pressed or not: screen readers announce "Show password, toggle button, pressed".
    toggle.setAttribute("aria-pressed", String(show));
  });

  async function checkLeak(password: string, run: number) {
    leakAbort?.abort();
    if (!optIn.checked || !password) {
      leak.hidden = leakChip.hidden = true;
      leaked = false;
      showVerdict();
      return;
    }
    leakAbort = new AbortController();
    leak.hidden = false;
    leak.dataset.state = "checking";
    leak.textContent = "Checking known breaches…";
    try {
      const count = await pwnedCount(password, leakAbort.signal);
      if (run !== latest) return;
      leak.dataset.state = count ? "leaked" : "clean";
      leak.textContent = count
        ? `Found ${count.toLocaleString("en")} times in data breaches. Don't use it anywhere.`
        : "Not found in known data breaches.";
      leakChip.hidden = !count;
      leaked = count > 0;
      showVerdict(leak.textContent);
    } catch (error) {
      if ((error as Error).name === "AbortError" || run !== latest) return;
      leak.dataset.state = "error";
      leak.textContent = "Couldn't reach Have I Been Pwned. Check your connection.";
      showVerdict(leak.textContent);
    }
  }

  async function update() {
    const password = input.value;
    const run = ++latest;
    score = null;
    leaked = false;
    clearTimeout(leakTimer);
    leakAbort?.abort();
    if (!password) {
      results.hidden = loading.hidden = failed.hidden = true;
      announce.textContent = "";
      return;
    }
    // Drop the previous password's leak result straight away; the new one follows after a pause.
    leak.hidden = !optIn.checked;
    leakChip.hidden = true;
    leak.dataset.state = "checking";
    leak.textContent = "Checking known breaches…";

    if (!worker) loading.hidden = false;
    const r = await analyse(password);
    if (run !== latest) return;
    loading.hidden = true;
    failed.hidden = Boolean(r);
    results.hidden = !r;
    if (!r) {
      announce.textContent = failed.textContent!.trim();
      return;
    }

    score = r.score;
    showVerdict();
    online.textContent = humanizeSeconds(r.guesses / 10);
    // A leaked database with a slow hash such as bcrypt, the case zxcvbn's estimates are made for.
    offline.textContent = humanizeSeconds(r.guesses / 1e4);
    warning.hidden = !r.warning;
    warning.textContent = r.warning ?? "";
    suggestions.replaceChildren(
      ...r.suggestions.map((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        return li;
      }),
    );
    // Wait for a pause in typing, so the leak check doesn't run on every keystroke.
    leakTimer = window.setTimeout(() => checkLeak(password, run), 600);
  }

  input.addEventListener("input", () => void update());
  optIn.addEventListener("change", () => {
    leakCheckOn = optIn.checked;
    // Check now rather than after the typing pause, and only once.
    clearTimeout(leakTimer);
    void checkLeak(input.value, latest);
  });
  find(root, "[data-clear]").addEventListener("click", () => {
    input.value = "";
    void update();
    input.focus();
  });
});
