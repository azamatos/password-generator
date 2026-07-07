import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

// ui
import "@/shared/ui/button";

// icons
import "@icons/copy";
import "@icons/regenerate";

// utils
import { toast } from "@/widgets/toast/utils";
import { vault } from "@/shared/stores/vault";

// types
import { Platform, ScoreLevel } from "@/shared/types";

@customElement("pass-platform-card")
export class PassPlatformCard extends LitElement {
  @property({ attribute: false }) platform!: Platform;
  @property() password = "";
  @property({ type: Number }) strengthLevel: ScoreLevel = 0;
  @property({ type: Number }) bits = 0;
  /** null = breach scan in progress (copy blocked) */
  @property({ attribute: false }) breached: boolean | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 22px;
    }

    .name {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }

    .meta {
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--ink-500);
    }

    .password {
      font-size: 36px;
      font-weight: 500;
      letter-spacing: 0.02em;
      font-family: var(--font-mono);
      word-break: break-all;
      margin-bottom: 22px;
      color: var(--ink-900);
    }

    .bars {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin-bottom: 22px;
    }

    .bar {
      height: 8px;
      border-radius: 999px;
      background: var(--ink-200);
      transition: background 300ms;
    }

    .bars[data-score="1"] .bar:nth-child(-n + 1) {
      background: var(--danger);
    }
    .bars[data-score="2"] .bar:nth-child(-n + 2) {
      background: var(--warn);
    }
    .bars[data-score="3"] .bar:nth-child(-n + 3) {
      background: var(--warn);
    }
    .bars[data-score="4"] .bar:nth-child(-n + 4) {
      background: var(--mint);
    }
    .bars[data-score="5"] .bar:nth-child(-n + 5) {
      background: var(--mint);
    }

    .entropy {
      font-size: 12px;
      font-family: var(--font-mono);
      color: var(--ink-500);
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  `;

  private async _copy() {
    if (!this.password || this.breached === null) return;

    try {
      await navigator.clipboard.writeText(this.password);

      if (vault.has(this.platform.id, this.password)) {
        toast.success("Copied to clipboard", this.password);
        return;
      }

      await vault.add({
        platformId: this.platform.id,
        password: this.password,
        savedAt: Date.now(),
        bits: this.bits,
        level: this.strengthLevel,
        breached: this.breached,
      });

      toast.success("Copied & Saved!", this.password);
    } catch {
      toast.error("Copy failed", "Check browser clipboard permissions");
    }
  }

  private _regenerate() {
    this.dispatchEvent(new CustomEvent("regenerate", { bubbles: true, composed: true }));
  }

  override render() {
    const scanning = this.breached === null;

    return html`
      <div class="header">
        <span class="name">Your password</span>
        <span class="entropy"> ${this.password.length} chars · ${this.bits} bits · cryptographic RNG </span>
      </div>

      <div class="password">${this.password}</div>

      <div class="bars" data-score=${this.strengthLevel}>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>

      <div class="actions">
        <ui-button fullWidth ?disabled=${scanning} @click=${this._copy} variant="platform">
          <copy-icon width="16" height="16"></copy-icon>
          <span>${scanning ? "Scanning…" : "Copy password"}</span>
        </ui-button>
        <ui-button size="lg" variant="soft" @click=${this._regenerate}>
          <regenerate-icon width="14" height="14"></regenerate-icon>
        </ui-button>
      </div>
    `;
  }
}
