import type { CharClass } from "@/lib/charsets";
import {
  generatePassphrase,
  passphraseBits,
  planPassphrase,
  type PassphraseOptions,
  type Separator,
} from "@/lib/passphrase";
import { checkRules, entropyBits, generate, plan, type PasswordOptions, type PasswordRules } from "@/lib/password";
import { strengthOf } from "@/lib/strength";
import { loadWordlist } from "@/lib/wordlist";
import { addRecent } from "./recent";

type Mode = "password" | "passphrase";

// Choices stay in memory, so they carry over when you switch platforms (the client router keeps this module alive).
const prefs: { mode: Mode; password: PasswordOptions; passphrase: PassphraseOptions } = {
  mode: "password",
  password: { length: 16, classes: { lower: true, upper: true, digit: true, symbol: true }, avoidAmbiguous: false },
  passphrase: { words: 5, separator: "-", capitalize: false, number: false },
};

/** What "recommended" under the sliders sets: 16 characters is about 100 bits, 5 words about 65. */
const RECOMMENDED = { length: 16, words: 5 };

let wordlist: string[] | null = null;

function setRange(input: HTMLInputElement, value: number, min: number, max: number) {
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.style.setProperty("--pct", `${max > min ? ((value - min) / (max - min)) * 100 : 0}%`);
}

function setup(root: HTMLElement) {
  const rules: PasswordRules = JSON.parse(root.dataset.rules ?? "{}");
  const site = root.dataset.site ?? "Any site";
  // "X" rather than "X (Twitter)" in "Meets X's rules".
  const owner = root.dataset.owner ?? site;
  const $ = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const $$ = <T extends Element>(selector: string) => [...root.querySelectorAll<T>(selector)];

  const output = $<HTMLOutputElement>("[data-output]");
  const bars = $<HTMLElement>("[data-bars]");
  const level = $<HTMLElement>("[data-level]");
  const details = $<HTMLElement>("[data-details]");
  const meets = $<HTMLElement>("[data-meets]");
  const meetsText = $<HTMLElement>("[data-meets-text]");
  const copy = $<HTMLButtonElement>("[data-copy]");
  const copyLabel = $<HTMLElement>("[data-copy-label]");
  const regenerate = $<HTMLButtonElement>("[data-regenerate]");
  const status = $<HTMLElement>("[data-status]");
  const result = $<HTMLElement>("[data-result]");
  const unsupported = $<HTMLElement>("[data-unsupported]");
  const unsupportedText = $<HTMLElement>("[data-unsupported-text]");
  const modeRadios = $$<HTMLInputElement>('input[name="mode"]');
  const panels = {
    password: $<HTMLElement>('[data-panel="password"]'),
    passphrase: $<HTMLElement>('[data-panel="passphrase"]'),
  };

  const length = $<HTMLInputElement>("[data-length]");
  const lengthValue = $<HTMLOutputElement>("[data-length-value]");
  const classInputs = $$<HTMLInputElement>("[data-class]");
  const ambiguous = $<HTMLInputElement>("[data-ambiguous]");
  const recommend = $<HTMLButtonElement>("[data-recommend]");
  const recommendWords = $<HTMLButtonElement>("[data-recommend-words]");

  const words = $<HTMLInputElement>("[data-words]");
  const wordsValue = $<HTMLOutputElement>("[data-words-value]");
  const separators = $$<HTMLInputElement>("[data-separator]");
  const capitalize = $<HTMLInputElement>("[data-capitalize]");
  const number = $<HTMLInputElement>("[data-number]");

  let current = "";

  function show(value: string, bits: number) {
    current = value;
    output.value = value;
    const strength = strengthOf(bits);
    const filled = Math.min(5, Math.max(1, Math.ceil(bits / 20)));
    bars.dataset.tone = strength.score === 1 ? "weak" : strength.score === 2 ? "fair" : "good";
    $$<HTMLElement>("[data-bars] i").forEach((bar, i) => bar.classList.toggle("on", i < filled));
    level.textContent = strength.label;
    const size = prefs.mode === "password" ? `${value.length} characters` : `${prefs.passphrase.words} words`;
    details.textContent = `${size} · ${Math.floor(bits)} bits`;
    // On "Any site" there are no site rules to meet, so the line stays hidden.
    const passes = checkRules(rules, value).every((c) => c.pass);
    meets.hidden = site === "Any site" || !passes;
    meetsText.textContent = `Meets ${owner}'s rules`;
    copy.disabled = regenerate.disabled = false;
  }

  function renderPassword() {
    const p = plan(rules, prefs.password);
    setRange(length, p.length, p.minLength, p.maxLength);
    lengthValue.value = String(p.length);
    $<HTMLElement>("[data-min]").textContent = String(p.minLength);
    $<HTMLElement>("[data-max]").textContent = String(p.maxLength);
    recommend.disabled = p.length === Math.min(Math.max(RECOMMENDED.length, p.minLength), p.maxLength);
    for (const input of classInputs) {
      const c = input.dataset.class as CharClass;
      const locked = p.locked.includes(c);
      const unavailable = p.unavailable.includes(c);
      input.checked = c in p.pools;
      input.disabled = locked || unavailable;
      const chip = input.closest<HTMLElement>("[data-chip]")!;
      chip.toggleAttribute("data-locked", locked);
      const title = chip.title.split(":")[0];
      chip.title = locked
        ? `${title}: required by ${owner}`
        : unavailable
          ? `${title}: not accepted by ${owner}`
          : title;
      chip.querySelector("[data-state]")!.textContent = locked
        ? `, required by ${owner}`
        : unavailable
          ? ", not accepted"
          : "";
    }
    ambiguous.checked = prefs.password.avoidAmbiguous;
    show(generate(p), entropyBits(p));
  }

  async function renderPassphrase() {
    const p = planPassphrase(rules, prefs.passphrase);
    const blocked = p.unsupported !== null;
    unsupported.hidden = !blocked;
    result.hidden = panels.passphrase.hidden = blocked;
    meets.hidden = true;
    if (blocked) {
      unsupportedText.textContent = `Passphrases don't fit ${owner}: ${p.unsupported}`;
      current = "";
      return;
    }

    setRange(words, p.words, p.minWords, p.maxWords);
    wordsValue.value = String(p.words);
    $<HTMLElement>("[data-words-min]").textContent = String(p.minWords);
    $<HTMLElement>("[data-words-max]").textContent = String(p.maxWords);
    recommendWords.disabled = p.words === Math.min(Math.max(RECOMMENDED.words, p.minWords), p.maxWords);
    for (const input of separators) {
      input.disabled = !p.separators.includes(input.value as Separator);
      input.checked = input.value === p.separator;
    }
    capitalize.checked = p.capitalize;
    capitalize.disabled = p.locked.capitalize;
    $<HTMLElement>('[data-note="capitalize"]').textContent = p.locked.capitalize ? "required" : "";
    number.checked = p.number;
    number.disabled = p.locked.number;
    $<HTMLElement>('[data-note="number"]').textContent = p.locked.number ? "required" : "";

    if (!wordlist) {
      output.value = "Loading words…";
      copy.disabled = regenerate.disabled = true;
      wordlist = await loadWordlist();
      if (prefs.mode !== "passphrase") return;
    }
    show(generatePassphrase(wordlist, p), passphraseBits(wordlist.length, p));
  }

  function render() {
    panels.password.hidden = prefs.mode !== "password";
    panels.passphrase.hidden = prefs.mode !== "passphrase";
    result.hidden = false;
    unsupported.hidden = true;
    for (const radio of modeRadios) radio.checked = radio.value === prefs.mode;
    if (prefs.mode === "password") renderPassword();
    else void renderPassphrase();
  }

  for (const radio of modeRadios) {
    radio.addEventListener("change", () => {
      prefs.mode = radio.value as Mode;
      render();
    });
  }
  $<HTMLButtonElement>("[data-use-password]").addEventListener("click", () => {
    prefs.mode = "password";
    render();
    modeRadios[0].focus();
  });
  length.addEventListener("input", () => {
    prefs.password.length = Number(length.value);
    renderPassword();
  });
  for (const input of classInputs) {
    input.addEventListener("change", () => {
      prefs.password.classes[input.dataset.class as CharClass] = input.checked;
      renderPassword();
    });
  }
  ambiguous.addEventListener("change", () => {
    prefs.password.avoidAmbiguous = ambiguous.checked;
    renderPassword();
  });
  words.addEventListener("input", () => {
    prefs.passphrase.words = Number(words.value);
    void renderPassphrase();
  });
  for (const input of separators) {
    input.addEventListener("change", () => {
      prefs.passphrase.separator = input.value as Separator;
      void renderPassphrase();
    });
  }
  capitalize.addEventListener("change", () => {
    prefs.passphrase.capitalize = capitalize.checked;
    void renderPassphrase();
  });
  number.addEventListener("change", () => {
    prefs.passphrase.number = number.checked;
    void renderPassphrase();
  });
  recommend.addEventListener("click", () => {
    prefs.password.length = RECOMMENDED.length;
    renderPassword();
  });
  recommendWords.addEventListener("click", () => {
    prefs.passphrase.words = RECOMMENDED.words;
    void renderPassphrase();
  });
  regenerate.addEventListener("click", render);

  let copiedTimer = 0;
  copy.addEventListener("click", async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current);
      addRecent({ value: current, site, at: Date.now() });
      copyLabel.textContent = "Copied";
      status.textContent = "Copied to the clipboard.";
    } catch {
      copyLabel.textContent = "Copy failed";
      status.textContent = "Couldn't copy. Select the text and copy it yourself.";
    }
    clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      copyLabel.textContent = "Copy";
      status.textContent = "";
    }, 2000);
  });

  render();
}

function init() {
  const root = document.querySelector<HTMLElement>("[data-generator]");
  if (root && !root.dataset.ready) {
    root.dataset.ready = "true";
    setup(root);
  }
}

// Module scripts run after the page is parsed, so start right away; later pages arrive through the client router.
init();
document.addEventListener("astro:page-load", init);
