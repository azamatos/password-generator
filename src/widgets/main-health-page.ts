import { LitElement, css, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

// components
import "@/components/health/strong-patterns";
import "@components/health/password-checker";
import "@/components/vault/privacy-banner";
import "@/components/health/score-info";

// ui
import "@shared/ui/button";

// icons
import "@icons/regenerate";
import "@icons/warning";
import "@icons/vault";

// utils
import { analysePassword, StrengthResult } from "@/shared/utils/strength";
import { checkBreach } from "@/shared/utils/hibp";
import { PasswordChangeEvent } from "@/components/health/search-input";

@customElement("pass-main-health")
export class PassMainHealth extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .wrapper {
      padding: 24px 56px 0 64px;
    }
    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 24px;
    }
    .title {
      font-family: var(--font-display);
      font-size: 44px;
      line-height: 1;
      margin: 0;
      letter-spacing: -0.02em;
      color: var(--ink-900);
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 24px;
      align-items: flex-start;
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .main {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .note {
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--ink-600);
      font-family: var(--font-mono);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  `;

  @state() private _result: StrengthResult | null = null;
  @state() private _isLoading = false;
  @state() private _search = "";

  private async _onPasswordChange(e: PasswordChangeEvent) {
    if (!e.password) {
      this._result = null;
      return;
    }

    this._search = e.password;

    this._isLoading = true;
    try {
      const breach = await checkBreach(e.password);
      this._result = analysePassword(e.password, breach);
    } finally {
      this._isLoading = false;
    }
  }

  private async _onPasswordClear() {
    this._search = "";
  }

  override render() {
    return html`
      <div class="wrapper">
        <div class="header">
          <h1 class="title">How strong is yours?</h1>
          <div class="header-actions">
            <span class="note">
              <vault-icon width="14" height="14"></vault-icon>
              Runs locally · nothing leaves your device
            </span>
          </div>
        </div>
        <div class="layout">
          <div class="sidebar">
            <pass-health-strong-patterns></pass-health-strong-patterns>
            ${this._result
              ? html`<pass-health-score-info
                  .level=${this._result?.level ?? null}
                  .score=${this._result?.score ?? null}
                >
                </pass-health-score-info>`
              : nothing}
          </div>

          <div class="main">
            <pass-main-health-checker
              .search=${this._search}
              .checks=${this._result?.checks ?? []}
              .isLoading=${this._isLoading}
              @password-change=${this._onPasswordChange}
              @password-clear=${this._onPasswordClear}
            ></pass-main-health-checker>

            <vault-privacy-banner
              title="Analyzed locally. Never sent."
              description="Every keystroke and breach check happens in your browser. We don't log your passwords, and the breach lookup uses k-anonymous hashing — only the first 5 chars of a SHA-1 ever leave your device."
              storage="IndexedDB"
            ></vault-privacy-banner>
          </div>
        </div>
      </div>
    `;
  }
}
