import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// components
import "@/components/vault/privacy-banner";
import "@/components/vault/entry-list";
import "@components/platform-banner";

// utils
import { type VaultEntry } from "@/shared/stores/vault";
import { timeAgo } from "@/shared/utils/date";
import { toast } from "@/widgets/toast";

@customElement("pass-platform-vault-card")
export class PassPlatformVaultCard extends LitElement {
  static styles = css`
    :host {
      background: var(--ink-900);
      border-radius: 18px;
      border-color: transparent;
      box-shadow: var(--shadow-xs);
      padding: 0px;
      overflow: hidden;
      color: var(--cream-50);
    }

    .wrapper {
      padding: 20px 22px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(247, 240, 225, 0.55);
    }

    .meta {
      font-size: 11px;
      font-family: var(--font-mono);
      color: rgba(247, 240, 225, 0.6);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .password {
      font-size: 22px;
      font-weight: 500;
      letter-spacing: 0.04em;
      letter-spacing: 0.04em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--font-mono);
      transition: color 160ms;
    }
  `;

  @property({ attribute: false }) entry!: VaultEntry | undefined;
  @state() private _revealed = true;

  private _toggleReveal() {
    this._revealed = !this._revealed;
  }

  private async _copy() {
    if (!this.entry) return;

    await navigator.clipboard
      .writeText(this.entry.password)
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Copy failed", "Check browser clipboard permissions");
      });
  }

  override render() {
    if (!this.entry) return nothing;

    const displayPassword = this._revealed ? this.entry.password : "•".repeat(Math.min(this.entry.password.length, 16));

    return html`
      <div class="wrapper">
        <div class="header">
          <span class="title">Current key</span>
          <span class="meta">
            <clock-icon width="12" height="12"></clock-icon>
            <span>${timeAgo(this.entry.savedAt)}</span>
          </span>
        </div>

        <span class="password ${this._revealed ? "password--revealed" : ""}">${displayPassword}</span>

        <div style="display: flex; gap: 8px;">
          <ui-button @click=${this._copy} fullWidth variant="platform">
            <copy-icon width="16" height="16"></copy-icon>
            <span>Copy</span>
          </ui-button>
          <ui-button
            title=${this._revealed ? "Hide" : "Reveal"}
            size="sm"
            variant="neutral"
            @click=${this._toggleReveal}
          >
            ${this._revealed
              ? html`<opened-eye-icon width="16" height="16"></opened-eye-icon>`
              : html`<closed-eye-icon width="16" height="16"></closed-eye-icon>`}
          </ui-button>
        </div>
      </div>
    `;
  }
}
