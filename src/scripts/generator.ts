// The password card and the options card (src/components/Generator.astro). All the rules logic is in src/lib; this
// file reads the controls into `prefs`, asks lib for a plan, and shows the result.
import type { CharClass } from "@/lib/charsets";
import { classNote } from "@/lib/describe";
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  generatePassphrase,
  passphraseBits,
  planPassphrase,
  SEPARATORS,
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

/** The password, with runs of digits and of symbols wrapped so Generator.astro can colour them. */
function marked(value: string): (string | HTMLSpanElement)[] {
  return value
    .split(/(\d+|[^A-Za-z\d ]+)/)
    .filter(Boolean)
    .map((part) => {
      if (/^[A-Za-z ]+$/.test(part)) return part;
      const span = document.createElement("span");
      span.className = /^\d/.test(part) ? "digit" : "symbol";
      span.textContent = part;
      return span;
    });
}

const apple = /Mac|iPhone|iPad/.test(navigator.userAgent);

mount("[data-generator]", (root) => {
  const rules: PasswordRules = JSON.parse(root.dataset.rules!);
  const site = root.dataset.site!;
  const id = root.dataset.id!;
  // "X" rather than "X (Twitter)", for "Locked by X".
  const owner = root.dataset.owner!;
  const anySite = "anySite" in root.dataset;

  const kind = find(root, "[data-kind]");
  const output = find<HTMLOutputElement>(root, "[data-output]");
  const loading = find(root, "[data-loading]");
  const meter = find(root, "[data-meter]");
  const details = find(root, "[data-details]");
  const meets = find(root, "[data-meets]");
  const copy = find<HTMLButtonElement>(root, "[data-copy]");
  const copyLabel = find(root, "[data-copy-label]");
  const copyFailed = find(root, "[data-copy-failed]");
  const regenerate = find<HTMLButtonElement>(root, "[data-regenerate]");
  const status = find(root, "[data-status]");
  const result = find(root, "[data-result]");
  const unsupported = find(root, "[data-unsupported]");
  const unsupportedTitle = find(root, "[data-unsupported-title]");
  const unsupportedText = find(root, "[data-unsupported-text]");
  const modeRadios = findAll<HTMLInputElement>(root, 'input[name="mode"]');
  const panels = {
    password: find(root, '[data-panel="password"]'),
    passphrase: find(root, '[data-panel="passphrase"]'),
  };
  const panelNote = find(root, "[data-panel-note]");
  find(root, "[data-copy-keys]").textContent = apple ? "⌘C" : "Ctrl C";

  // Password controls
  const length = bindRange(root, "length", {
    recommended: DEFAULT_PASSWORD_OPTIONS.length,
    onChange: (value) => {
      prefs.password.length = value;
      renderPassword();
    },
  });
  const classInputs = findAll<HTMLInputElement>(root, "[data-class]");
  const lockedHint = find(root, "[data-locked-hint]");
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
  const separatorsHint = find(root, "[data-separators-hint]");
  const capitalize = find<HTMLInputElement>(root, "[data-capitalize]");
  const number = find<HTMLInputElement>(root, "[data-number]");
  /** The line under a switch: its example, or why it can't be turned off. */
  const hint = (input: HTMLInputElement, example: string, locked: boolean) => {
    find(input.closest("label")!, "[data-hint]").textContent = locked ? `Required by ${owner}` : example;
  };

  /** What Copy copies; empty while there's nothing to copy. */
  let current = "";

  function show(value: string, bits: number) {
    current = value;
    output.hidden = false;
    loading.hidden = true;
    output.classList.toggle("phrase", prefs.mode === "passphrase");
    output.replaceChildren(...marked(value));
    showMeter(meter, meterForBits(bits));
    const size = `${value.length} characters`;
    details.textContent =
      prefs.mode === "password"
        ? `${size} · ${Math.floor(bits)} bits`
        : `${prefs.passphrase.words} words · ${size} · ${Math.floor(bits)} bits`;
    meets.hidden = anySite || !checkRules(rules, value).every((c) => c.pass);
    copy.disabled = regenerate.disabled = false;
    copyFailed.hidden = true;
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
      if (locked) chip.dataset.lock = "required";
      else if (p.unavailable.includes(c)) chip.dataset.lock = "unavailable";
      else delete chip.dataset.lock;
      find(chip, "[data-note]").textContent = classNote(c, p, rules);
    }
    lockedHint.hidden = p.locked.length === 0 && p.unavailable.length === 0;
    ambiguous.checked = prefs.password.avoidAmbiguous;
    show(generate(p), entropyBits(p));
  }

  /** Shows why there's no passphrase, with "Use a password" in its place. */
  function noPassphrase(title: string, reason: string) {
    unsupported.hidden = panelNote.hidden = false;
    result.hidden = panels.passphrase.hidden = true;
    meets.hidden = true;
    unsupportedTitle.textContent = title;
    unsupportedText.textContent = reason;
    current = "";
  }

  async function renderPassphrase() {
    const p = planPassphrase(rules, prefs.passphrase);
    unsupported.hidden = panelNote.hidden = true;
    result.hidden = panels.passphrase.hidden = false;
    if (p.unsupported !== null) {
      noPassphrase("Too short for a passphrase", `Passphrases don't fit ${owner}: ${p.unsupported}`);
      return;
    }

    words.set(p.words, p.minWords, p.maxWords);
    for (const input of separators) {
      input.disabled = !p.separators.includes(input.value as Separator);
      input.checked = input.value === p.separator;
    }
    separatorsHint.hidden = p.separators.length === SEPARATORS.length;
    capitalize.checked = p.capitalize;
    capitalize.disabled = p.locked.capitalize;
    hint(capitalize, "Copper-Ladle", p.locked.capitalize);
    number.checked = p.number;
    number.disabled = p.locked.number;
    hint(number, "amber4", p.locked.number);

    if (!wordlist) {
      output.hidden = true;
      loading.hidden = false;
      showMeter(meter, null);
      details.textContent = "";
      meets.hidden = true;
      copy.disabled = regenerate.disabled = true;
      try {
        wordlist = await loadWordlist();
      } catch {
        // Offline, or a tab opened before a deploy asking for a file that's gone. A failed import may be cached,
        // so a reload is the sure retry.
        if (prefs.mode === "passphrase") {
          noPassphrase("Couldn't load the word list", "Check your connection, then reload the page.");
        }
        return;
      }
      if (prefs.mode !== "passphrase") return;
    }
    show(generatePassphrase(wordlist, p), passphraseBits(wordlist.length, p));
  }

  function render() {
    kind.textContent = prefs.mode === "password" ? "Your password" : "Your passphrase";
    regenerate.setAttribute("aria-label", prefs.mode === "password" ? "New password" : "New passphrase");
    panels.password.hidden = prefs.mode !== "password";
    panels.passphrase.hidden = prefs.mode !== "passphrase";
    result.hidden = false;
    unsupported.hidden = panelNote.hidden = true;
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
      addRecent({ value: current, site, id, at: Date.now() });
      copyLabel.textContent = "Copied";
      copy.toggleAttribute("data-copied", true);
      copyFailed.hidden = true;
      status.textContent = "Copied to the clipboard.";
    } catch {
      copyLabel.textContent = "Copy failed";
      // Stays until there's a new password, so there's time to copy by hand.
      copyFailed.hidden = false;
      status.textContent = "Couldn't copy. Select the password and copy it yourself.";
    }
    clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      copyLabel.textContent = "Copy";
      copy.removeAttribute("data-copied");
      status.textContent = "";
    }, 1800);
  });

  render();
});
