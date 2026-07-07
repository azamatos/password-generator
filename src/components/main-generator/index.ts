import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// components
import "@/components/main-generator/main-card";
import "@/shared/ui/length-control";
import "@/components/main-generator/charset-control";
import "@/components/main-generator/rules-check";
import "@/components/breach-scan";

// utils
import { GeneratorParams } from "@/shared/utils/generator";
import type { Platform } from "@/shared/utils/platforms";
import { scorePassword } from "@/shared/utils/scoring";
import { vault } from "@/shared/stores/vault";

@customElement("pass-generator")
export class PassGenerator extends LitElement {
  @property({ attribute: false }) platform!: Platform;
  @property({ attribute: false }) params!: GeneratorParams;
  @property() password = "";

  /** null = scan in progress (copy blocked), boolean = result known */
  @state() private _breached: boolean | null = null;

  static styles = css`
    :host {
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

  private _onCharsetChange(e: CustomEvent<Partial<GeneratorParams>>) {
    this._emitParams(e.detail);
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
    // Allow copy on network error — treat as unknown (not blocked)
    this._breached = false;
  }

  override render() {
    const { level, bits } = scorePassword(this.password, this.params);

    if (!this.platform) {
      return null;
    }

    return html`
      <div class="card card--main">
        <pass-main-card
          .platform=${this.platform}
          password=${this.password}
          strengthLevel=${level}
          bits=${bits}
          .breached=${this._breached}
          @regenerate=${this._onRegenerate}
        ></pass-main-card>
      </div>

      <div class="grid">
        <div class="card card--sub">
          <pass-length-control
            value=${this.params.length}
            min=${this.platform.minLength}
            @length-change=${this._onLengthChange}
          ></pass-length-control>
        </div>
        <div class="card card--sub">
          <pass-charset-control .charset=${this.params} @charset-change=${this._onCharsetChange}></pass-charset-control>
        </div>
      </div>

      <div class="card card--sub">
        <pass-rules-check password=${this.password} .platform=${this.platform}></pass-rules-check>
      </div>

      <div class="card card--sub">
        <pass-breach-scan
          password=${this.password}
          @breach-result=${this._onBreachResult}
          @breach-error=${this._onBreachError}
        ></pass-breach-scan>
      </div>
    `;
  }
}
