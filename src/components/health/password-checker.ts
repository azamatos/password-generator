import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

// components
import "@/components/health/strong-patterns";
import "@/components/vault/privacy-banner";
import "@/components/health/score-info";
import "@/components/health/search-input";

// ui
import "@shared/ui/button";
import "@shared/ui/loader";

// icons
import "@icons/regenerate";
import "@icons/check";
import "@icons/info";
import "@icons/cross";
import "@icons/vault";

// utils
import { CheckItem, navigateToRoot } from "@/shared/utils";

export class PasswordClearEvent extends Event {
  static readonly TYPE = "password-clear";
  constructor() {
    super(PasswordClearEvent.TYPE, { bubbles: true, composed: true });
  }
}

const iconMap = {
  pass: html`<check-icon width="10" height="10"></check-icon>`,
  warn: html`<info-icon width="16" height="16"></info-icon>`,
  fail: html`<cross-icon width="10" height="10"></cross-icon>`,
} satisfies Record<CheckItem["status"], unknown>;

@customElement("pass-main-health-checker")
export class PassMainHealthChecker extends LitElement {
  static styles = css`
    .root {
      background: rgb(255, 255, 255);
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
      padding: 32px;
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
      color: var(--ink-500);
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
    .header-actions {
      display: flex;
      gap: 8px;
    }

    .checker-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }

    .checker {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0px;
      border-bottom: 1px solid var(--ink-100);
    }

    .checker-icon {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      color: rgb(255, 255, 255);
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &.pass {
        background: var(--mint);
      }
      &.warn {
        background: var(--warn);
      }
      &.fail {
        background: var(--danger);
      }
    }

    .checker-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .checker-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-800);
    }

    .checker-subtitle {
      font-size: 11.5px;
      color: var(--ink-500);
      font-family: var(--font-mono);
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  `;

  private _getCheckerIcon(status: CheckItem["status"]) {
    return html`
      <span
        class=${classMap({
          "checker-icon": true,
          [status]: true,
        })}
      >
        ${iconMap[status]}
      </span>
    `;
  }

  @property({ type: Boolean }) isLoading!: boolean;
  @property({ type: Boolean }) isPlatformPage: boolean = false;
  @property({ type: String }) search!: string;
  @property({ attribute: false }) checks: CheckItem[] = [];

  private _handleClear() {
    this.dispatchEvent(new PasswordClearEvent());
  }

  override render() {
    return html`
      <div class="root">
        <div class="header">
          <span class="title">Check your password</span>
          <span class="note">
            <vault-icon width="14" height="14"></vault-icon>
            Analyzed locally · never sent
          </span>
        </div>
        <pass-health-input .search=${this.search}></pass-health-input>
        <div class="checker-list">
          ${this.isLoading
            ? html`<ui-loader size="lg"></ui-loader>`
            : this.checks.map(
                (check) =>
                  html` <div class="checker">
                    ${this._getCheckerIcon(check.status)}
                    <div class="checker-meta">
                      <div class="checker-title">${check.label}</div>
                      <div class="checker-subtitle">${check.detail}</div>
                    </div>
                  </div>`,
              )}
        </div>
        <div class="actions">
          <ui-button @click=${navigateToRoot} variant=${this.isPlatformPage ? "platform" : "accent"} fullWidth>
            <regenerate-icon width="16" height="16"></regenerate-icon>
            Generate a stronger one
          </ui-button>
          <ui-button variant="ghost" @click=${this._handleClear}>Clear</ui-button>
        </div>
      </div>
    `;
  }
}
