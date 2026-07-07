import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// components
import "@/shared/ui/length-control";
import "@/shared/ui/tips";
import "@/components/breach-scan";

// local
import "./platform-card";
import "./rules-check";

// utils
import { scorePassword } from "@/shared/utils/scoring";
import { vault } from "@/shared/stores/vault";

// types
import { Platform, GeneratorParams } from "@/shared/types";

@customElement("pass-platform-generator")
export class PassPlatformGenerator extends LitElement {
  @property({ attribute: false }) platform!: Platform;
  @property({ attribute: false }) params!: GeneratorParams;
  @property() password = "";

  /** null = scan in progress (copy blocked), boolean = result known */
  @state() private _breached: boolean | null = null;

  static styles = css`
    :host {
      padding: 40px 56px 0 64px;
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 28px;
    }

    .block {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .card {
      background: var(--color-white);
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
    }

    .card--main {
      padding: 32px;
    }
    .card--sub {
      padding: 22px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    vault.init();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has("password")) {
      this._breached = null;
    }
  }

  private _onRegenerate() {
    this.dispatchEvent(new CustomEvent("regenerate", { bubbles: true, composed: true }));
  }

  private _onLengthChange(e: CustomEvent<number>) {
    this._emitParams({ length: e.detail });
  }

  private _emitParams(partial: Partial<GeneratorParams>) {
    this.dispatchEvent(
      new CustomEvent<GeneratorParams>("params-change", {
        detail: { ...this.params, ...partial },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onBreachResult(e: CustomEvent<{ breached: boolean; count: number }>) {
    this._breached = e.detail.breached;
  }

  private _onBreachError() {
    this._breached = false;
  }

  override render() {
    const { level, bits } = scorePassword(this.password, this.params);

    return html`
      <div class="block">
        <div class="card card--main">
          <pass-platform-card
            .platform=${this.platform}
            password=${this.password}
            strengthLevel=${level}
            bits=${bits}
            .breached=${this._breached}
            @regenerate=${this._onRegenerate}
          ></pass-platform-card>
        </div>
        <div class="card card--sub">
          <pass-tips .title=${this.platform.name} .tips=${this.platform.tips}></pass-tips>
        </div>
      </div>

      <div class="block">
        <div class="card card--sub">
          <pass-length-control
            value=${this.params.length}
            min=${this.platform.minLength}
            @length-change=${this._onLengthChange}
            .hints=${false}
          ></pass-length-control>
        </div>
        <div class="card card--sub">
          <pass-platform-rules-check password=${this.password} .platform=${this.platform}></pass-platform-rules-check>
        </div>
        <div class="card card--sub">
          <pass-breach-scan
            password=${this.password}
            @breach-result=${this._onBreachResult}
            @breach-error=${this._onBreachError}
          ></pass-breach-scan>
        </div>
      </div>
    `;
  }
}
