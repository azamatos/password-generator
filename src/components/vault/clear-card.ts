import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@shared/ui/button";

/**
 * Events fired:
 *   vault-clear — no detail — emitted when user confirms
 */
@customElement("vault-clear-card")
export class VaultClearCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .card {
      background: #fff;
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
      padding: 18px;
    }
    .card-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
      margin-bottom: 10px;
    }
    .desc {
      font-size: 12.5px;
      color: var(--ink-700);
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .confirm-row {
      width: 100%;
      display: flex;
      gap: 8px;
    }
  `;

  /** Disable the button when vault is already empty. */
  @property({ type: Boolean }) disabled = false;

  @state() private _confirming = false;

  private _confirm() {
    this.dispatchEvent(new CustomEvent("vault-clear", { bubbles: true, composed: true }));
    this._confirming = false;
  }

  private _openConfirm() {
    if (!this.disabled) this._confirming = true;
  }

  private _closeConfirm() {
    this._confirming = false;
  }

  override render() {
    return html`
      <div class="card">
        <div class="card-label">Clear vault</div>
        <div class="desc">Permanently delete all saved entries from this device. This cannot be undone.</div>
        ${this._confirming
          ? html`
              <div class="confirm-row">
                <ui-button size="xs" variant="primary" @click=${this._confirm}>Confirm</ui-button>
                <ui-button size="xs" variant="ghost" @click=${this._closeConfirm}> Cancel </ui-button>
              </div>
            `
          : html`
              <ui-button
                class="clear-btn"
                size="xs"
                .disabled=${this.disabled}
                variant="accent-white"
                @click=${this._openConfirm}
              >
                Clear all entries
              </ui-button>
            `}
      </div>
    `;
  }
}
