import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// components
import "@/components/health/strong-patterns";
import "@components/health/password-checker";
import "@/components/vault/privacy-banner";
import "@/components/health/score-info";
import "@/components/platform-banner";

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
import { getPlatformById } from "@/shared/utils/platforms";

// types
import { Platform } from "@/shared/types";

@customElement("pass-platform-health")
export class PassPlatformHealth extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      padding-top: 24px;
    }

    .wrapper {
      padding: 40px 56px 0 64px;
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 260px;
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
  @property() platformId = "";
  @state() private _platform: Platform | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._platform = getPlatformById(this.platformId);
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has("platformId") && this.platformId) {
      this.style.setProperty("--platform-color", `var(--plat-${this.platformId})`);
    }
  }

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
    if (!this._platform) {
      return null;
    }

    return html`
      <div class="container">
        <pass-platform-banner .platform=${this._platform}></pass-platform-banner>
        <div class="wrapper">
          <div class="layout">
            <div class="main">
              <pass-main-health-checker
                .search=${this._search}
                .checks=${this._result?.checks ?? []}
                .isLoading=${this._isLoading}
                .isPlatformPage=${true}
                @password-change=${this._onPasswordChange}
                @password-clear=${this._onPasswordClear}
              ></pass-main-health-checker>
            </div>

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
          </div>
        </div>
      </div>
    `;
  }
}
