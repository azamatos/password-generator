// The /health page: zxcvbn's estimate from a worker, then a leak check once typing pauses.
import { pwnedCount } from "@/lib/hibp";
import { humanizeSeconds } from "@/lib/time";
import { find, mount } from "./dom";
import type { CheckRequest, CheckResponse } from "./zxcvbn.worker";

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;
const TONES = ["weak", "weak", "fair", "good", "good"] as const;

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, (r: CheckResponse) => void>();

/** zxcvbn's verdict for a password. The worker and its word lists load on the first call. */
function analyse(password: string): Promise<CheckResponse> {
  if (!worker) {
    worker = new Worker(new URL("./zxcvbn.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<CheckResponse>) => {
      pending.get(e.data.id)?.(e.data);
      pending.delete(e.data.id);
    };
  }
  const id = ++nextId;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    worker!.postMessage({ id, password } satisfies CheckRequest);
  });
}

mount("[data-health]", (root) => {
  const input = find<HTMLInputElement>(root, "[data-input]");
  const toggle = find<HTMLButtonElement>(root, "[data-toggle]");
  const optIn = find<HTMLInputElement>(root, "[data-leak-opt-in]");
  const loading = find(root, "[data-loading]");
  const results = find(root, "[data-results]");
  const bars = find(root, "[data-bars]");
  const verdict = find(root, "[data-verdict]");
  const leakChip = find(root, "[data-leak-chip]");
  const online = find(root, "[data-online]");
  const offline = find(root, "[data-offline]");
  const leak = find(root, "[data-leak]");
  const warning = find(root, "[data-warning]");
  const suggestions = find<HTMLUListElement>(root, "[data-suggestions]");

  let latest = 0;
  let leakTimer = 0;
  let leakAbort: AbortController | undefined;

  const setBars = (score: number) => {
    bars.dataset.tone = TONES[score];
    [...bars.children].forEach((bar, i) => bar.classList.toggle("on", i <= score));
  };

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
      // A leaked password is guessed first, however random it looks.
      if (count) {
        setBars(0);
        verdict.textContent = LABELS[0];
      }
    } catch (error) {
      if ((error as Error).name === "AbortError" || run !== latest) return;
      leak.dataset.state = "error";
      leak.textContent = "Couldn't reach Have I Been Pwned. Check your connection.";
    }
  }

  async function update() {
    const password = input.value;
    const run = ++latest;
    clearTimeout(leakTimer);
    leakAbort?.abort();
    if (!password) {
      results.hidden = loading.hidden = true;
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
    results.hidden = false;

    setBars(r.score);
    verdict.textContent = LABELS[r.score];
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
  optIn.addEventListener("change", () => void checkLeak(input.value, latest));
  find(root, "[data-clear]").addEventListener("click", () => {
    input.value = "";
    void update();
    input.focus();
  });
});
