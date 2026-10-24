// The generator card and its controls (src/components/Generator.astro). All the rules logic is in src/lib;
// this file reads the controls into `prefs`, asks lib for a plan, and shows the result.
import type { CharClass } from "@/lib/charsets";
import { chipText } from "@/lib/describe";
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  generatePassphrase,
  passphraseBits,
  planPassphrase,
  type PassphraseOptions,
  type Separator,
} from "@/lib/passphrase";
import {
  checkRules,
  DEFAULT_PASSWORD_OPTIONS,
  entropyBits,
  generate,
  plan,
  type PasswordOptions,
  type PasswordRules,
} from "@/lib/password";
import { meterForBits } from "@/lib/strength";
import { loadWordlist } from "@/lib/wordlist";
import { find, findAll, mount } from "./dom";
import { showMeter } from "./meter";
import { bindRange } from "./range";
import { addRecent } from "./recent";

type Mode = "password" | "passphrase";

// Choices stay in memory, so they carry over when you switch platforms (the client router keeps this module alive).
const prefs: { mode: Mode; password: PasswordOptions; passphrase: PassphraseOptions } = {
  mode: "password",
  password: structuredClone(DEFAULT_PASSWORD_OPTIONS),
  passphrase: { ...DEFAULT_PASSPHRASE_OPTIONS },
};

let wordlist: string[] | null = null;

mount("[data-generator]", (root) => {
  const rules: PasswordRules = JSON.parse(root.dataset.rules!);
  const site = root.dataset.site!;
  // "X" rather than "X (Twitter)", for "required by X".
  const owner = root.dataset.owner!;
  const anySite = "anySite" in root.dataset;

  const output = find<HTMLOutputElement>(root, "[data-output]");
  const bars = find(root, "[data-bars]");
  const level = find(root, "[data-level]");
  const details = find(root, "[data-details]");
  const meets = find(root, "[data-meets]");
  const copy = find<HTMLButtonElement>(root, "[data-copy]");
  const copyLabel = find(root, "[data-copy-label]");
  const regenerate = find<HTMLButtonElement>(root, "[data-regenerate]");
  const status = find(root, "[data-status]");
  const result = find(root, "[data-result]");
  const unsupported = find(root, "[data-unsupported]");
  const unsupportedText = find(root, "[data-unsupported-text]");
  const modeRadios = findAll<HTMLInputElement>(root, 'input[name="mode"]');
  const panels = {
    password: find(root, '[data-panel="password"]'),
    passphrase: find(root, '[data-panel="passphrase"]'),
  };

  // Password controls
  const length = bindRange(root, "length", {
    recommended: DEFAULT_PASSWORD_OPTIONS.length,
    onChange: (value) => {
      prefs.password.length = value;
      renderPassword();
    },
  });
  const classInputs = findAll<HTMLInputElement>(root, "[data-class]");
  const ambiguous = find<HTMLInputElement>(root, "[data-ambiguous]");

  // Passphrase controls
  const words = bindRange(root, "words", {
    recommended: DEFAULT_PASSPHRASE_OPTIONS.words,
    onChange: (value) => {
      prefs.passphrase.words = value;
      void renderPassphrase();
    },
  });
  const separators = findAll<HTMLInputElement>(root, "[data-separator]");
  const capitalize = find<HTMLInputElement>(root, "[data-capitalize]");
  const number = find<HTMLInputElement>(root, "[data-number]");
  const capitalizeNote = find(root, '[data-note="capitalize"]');
  const numberNote = find(root, '[data-note="number"]');

  /** What Copy copies; empty while there's nothing to copy. */
  let current = "";

  function show(value: string, bits: number) {
    current = value;
    output.value = value;
    const meter = meterForBits(bits);
    showMeter(bars, meter);
    level.textContent = meter.label;
    const size = prefs.mode === "password" ? `${value.length} characters` : `${prefs.passphrase.words} words`;
    details.textContent = `${size} · ${Math.floor(bits)} bits`;
    meets.hidden = anySite || !checkRules(rules, value).every((c) => c.pass);
    copy.disabled = regenerate.disabled = false;
  }

  function renderPassword() {
    const p = plan(rules, prefs.password);
    length.set(p.length, p.minLength, p.maxLength);
    for (const input of classInputs) {
      const c = input.dataset.class as CharClass;
      const locked = p.locked.includes(c);
      input.checked = c in p.pools;
      input.disabled = locked || p.unavailable.includes(c);
      const chip = input.closest<HTMLElement>("[data-chip]")!;
      const text = chipText(chip.dataset.title!, c, p, owner);
      chip.toggleAttribute("data-locked", locked);
      chip.title = text.title;
      find(chip, "[data-state]").textContent = text.state;
    }
    ambiguous.checked = prefs.password.avoidAmbiguous;
    show(generate(p), entropyBits(p));
  }

  /** Shows why there's no passphrase, with "Use a password" in its place. */
  function noPassphrase(reason: string) {
    unsupported.hidden = false;
    result.hidden = panels.passphrase.hidden = true;
    unsupportedText.textContent = reason;
    current = "";
  }

  async function renderPassphrase() {
    const p = planPassphrase(rules, prefs.passphrase);
    unsupported.hidden = true;
    result.hidden = panels.passphrase.hidden = false;
    meets.hidden = true;
    if (p.unsupported !== null) {
      noPassphrase(`Passphrases don't fit ${owner}: ${p.unsupported}`);
      return;
    }

    words.set(p.words, p.minWords, p.maxWords);
    for (const input of separators) {
      input.disabled = !p.separators.includes(input.value as Separator);
      input.checked = input.value === p.separator;
    }
    capitalize.checked = p.capitalize;
    capitalize.disabled = p.locked.capitalize;
    capitalizeNote.textContent = p.locked.capitalize ? "required" : "";
    number.checked = p.number;
    number.disabled = p.locked.number;
    numberNote.textContent = p.locked.number ? "required" : "";

    if (!wordlist) {
      output.value = "Loading words…";
      copy.disabled = regenerate.disabled = true;
      try {
        wordlist = await loadWordlist();
      } catch {
        // Offline, or a tab opened before a deploy asking for a file that's gone. A failed import may be cached,
        // so a reload is the sure retry.
        if (prefs.mode === "passphrase") {
          noPassphrase("Couldn't load the word list. Check your connection, then reload the page.");
        }
        return;
      }
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
  find(root, "[data-use-password]").addEventListener("click", () => {
    prefs.mode = "password";
    render();
    modeRadios[0].focus();
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
});
