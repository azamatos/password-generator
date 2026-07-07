import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// widgets
import "@/components/app-header";
import "@/components/platform-generator";

// components
import "@/components/platform-banner";

// utils
import { getPlatformById } from "@/shared/utils/platforms";
import { generatePassword } from "@/shared/utils/generator";

// types
import { GeneratorParams, Platform } from "@/shared/types";

const DEFAULT_PARAMS: GeneratorParams = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

@customElement("pass-platform")
export class PassMain extends LitElement {
  @property() platformId = "";
  @state() private _password = "";
  @state() private _platform: Platform | null = null;
  @state() private _params: GeneratorParams = { ...DEFAULT_PARAMS };

  override connectedCallback() {
    super.connectedCallback();
    this._platform = getPlatformById(this.platformId);
    this._generate();
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has("platformId") && this.platformId) {
      this.style.setProperty("--platform-color", `var(--plat-${this.platformId})`);
    }
  }

  private _generate() {
    if (!this._platform) {
      return;
    }

    this._password = generatePassword(this._platform, this._params);
  }

  private _onParamsChange(e: CustomEvent<GeneratorParams>) {
    this._params = e.detail;
    this._generate();
  }

  private _onRegenerate() {
    this._generate();
  }

  override render() {
    if (!this._platform) {
      return null;
    }

    return html`
      <div style="padding-top: 24px;">
        <pass-platform-banner .platform=${this._platform}></pass-platform-banner>
        <pass-platform-generator
          .platform=${this._platform}
          .params=${this._params}
          password=${this._password}
          @params-change=${this._onParamsChange}
          @regenerate=${this._onRegenerate}
        ></pass-platform-generator>
      </div>
    `;
  }
}
