import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

// components
import "@/components/platform-list";
import "@/components/main-generator";

// utils
import { generatePassword } from "@/shared/utils/generator";
import { getPlatformById, platforms } from "@/shared/utils/platforms";
import { GeneratorParams, Platform } from "@/shared/types";
import { DEFAULT_GENERATOR_PARAMS } from "@/shared/constants";

@customElement("pass-main")
export class PassMain extends LitElement {
  static styles = css`
    .wrapper {
      padding: 24px 56px 0 64px;
    }
    .container {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 24px;
      align-items: flex-start;
    }
  `;

  @state() private _platformId = "instagram";
  @state() private _params: GeneratorParams = { ...DEFAULT_GENERATOR_PARAMS };
  @state() private _password = "";

  private get _platform(): Platform {
    return getPlatformById(this._platformId) ?? platforms[0];
  }

  override connectedCallback() {
    super.connectedCallback();
    this._generate();
  }

  private _generate() {
    this._password = generatePassword(this._platform, this._params);
  }

  private _onPlatformSelect(e: CustomEvent<string>) {
    this._platformId = e.detail;
    this._generate();
  }

  private _onParamsChange(e: CustomEvent<GeneratorParams>) {
    this._params = e.detail;
    this._generate();
  }

  private _onRegenerate() {
    this._generate();
  }

  override render() {
    return html`
      <div class="wrapper">
        <div class="container">
          <pass-platforms-list
            .platforms=${platforms}
            .selectedId=${this._platformId}
            @platform-select=${this._onPlatformSelect}
          ></pass-platforms-list>

          <pass-generator
            .platform=${this._platform}
            .params=${this._params}
            password=${this._password}
            @params-change=${this._onParamsChange}
            @regenerate=${this._onRegenerate}
          ></pass-generator>
        </div>
      </div>
    `;
  }
}
