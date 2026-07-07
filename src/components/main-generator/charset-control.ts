import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@/shared/ui/button";
import { GeneratorParams } from "@/shared/utils/generator";

type CharsetState = Omit<GeneratorParams, "length">;

@customElement("pass-charset-control")
export class PassCharsetControl extends LitElement {
  @property({ attribute: false }) charset: CharsetState = {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  };

  static styles = css`
    :host {
      display: block;
    }

    .label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
      margin-bottom: 14px;
      display: block;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .chip {
      font-size: 12px;
      font-family: var(--font-mono);
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: 120ms;
    }

    .chip.off {
      background: var(--ink-100);
      color: var(--ink-500);
    }

    .chip:hover {
      opacity: 0.85;
    }
  `;

  private _toggle(key: keyof CharsetState) {
    this.dispatchEvent(
      new CustomEvent<Partial<CharsetState>>("charset-change", {
        detail: { [key]: !this.charset[key] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _chip(label: string, key: keyof CharsetState) {
    return html`
      <ui-button class="chip" variant=${this.charset[key] ? "primary" : "soft"} @click=${() => this._toggle(key)}>
        ${label}
      </ui-button>
    `;
  }

  override render() {
    return html`
      <span class="label">Character Set</span>
      <div class="chips">
        ${this._chip("A–Z", "includeUppercase")} ${this._chip("a–z", "includeLowercase")}
        ${this._chip("0–9", "includeNumbers")} ${this._chip("!@#$", "includeSymbols")}
      </div>
    `;
  }
}
