import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Platform } from "@/shared/utils/platforms";

// UI
import "@/shared/ui/button";
import "@shared/ui/avatar";
import "@/shared/ui/chip";

// icons
import "@icons/copy";
import "@icons/regenerate";

// utils
import { ScoreLevel } from "@/shared/utils/scoring";
import { toast } from "@/widgets/toast/utils";
import { vault } from "@/shared/stores/vault";

type ChipVariant = "success" | "neutral" | "warn" | "danger" | "new" | "soft";

const SCORE_MAP = {
  0: { label: "None", variant: "danger", filledBars: 0 },
  1: { label: "Very Weak", variant: "danger", filledBars: 1 },
  2: { label: "Weak", variant: "warn", filledBars: 2 },
  3: { label: "Strong", variant: "success", filledBars: 4 },
  4: { label: "Excellent", variant: "success", filledBars: 5 },
} satisfies Record<ScoreLevel | 0, { label: string; variant: ChipVariant; filledBars: number }>;

@customElement("pass-main-card")
export class PassMainCard extends LitElement {
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
      gap: 10px;
      margin-bottom: 22px;
    }

    .name {
      font-size: 18px;
      font-weight: 600;
    }

    .meta {
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--ink-500);
    }

    .badge {
      margin-left: auto;
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

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
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

      toast.success("Copied & Saved!");
    } catch {
      toast.error("Copy failed", "Check browser clipboard permissions");
    }
  }

  private _regenerate() {
    this.dispatchEvent(new CustomEvent("regenerate", { bubbles: true, composed: true }));
  }

  override render() {
    const { label, variant, filledBars } = SCORE_MAP[this.strengthLevel];
    const scanning = this.breached === null;

    return html`
      <div class="header">
        <pass-platform-avatar
          size="lg"
          title=${this.platform.short ?? this.platform.name.slice(0, 2)}
        ></pass-platform-avatar>
        <span class="name">${this.platform.name}</span>
        <span class="meta">· ${this.platform.summary}</span>
        ${label ? html`<ui-chip class="badge" is-upper-case variant=${variant}>${label}</ui-chip>` : ""}
      </div>

      <div class="password">${this.password}</div>

      <div class="bars" data-score=${filledBars}>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>

      <div class="footer">
        <span class="entropy"> ${this.password.length} chars · ${this.bits} bits · cryptographic RNG </span>
        <div class="actions">
          <ui-button variant="ghost" @click=${this._regenerate}>
            <regenerate-icon width="14" height="14"></regenerate-icon>
            <span>Regenerate</span>
          </ui-button>
          <ui-button variant="accent" ?disabled=${scanning} @click=${this._copy}>
            <copy-icon width="14" height="14"></copy-icon>
            <span>${scanning ? "Scanning…" : "Copy"}</span>
          </ui-button>
        </div>
      </div>
    `;
  }
}
