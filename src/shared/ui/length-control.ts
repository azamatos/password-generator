import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/constants";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("pass-length-control")
export class PassLengthControl extends LitElement {
  @property({ type: Number }) value = 16;
  @property({ type: Number }) min = PASSWORD_MIN_LENGTH;
  @property({ type: Number }) max = PASSWORD_MAX_LENGTH;
  @property({ type: Number }) recommended = 16;
  @property({ type: Boolean }) hints = true;

  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }

    .label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }

    .value {
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-mono);
    }

    .slider-wrap {
      position: relative;
      height: 8px;
      background: var(--ink-200);
      border-radius: 999px;
      margin-bottom: 8px;
    }

    .slider-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--platform-color, var(--ink-900));
      border-radius: 999px;
      pointer-events: none;
    }

    input[type="range"] {
      position: absolute;
      inset: 0;
      width: 100%;
      opacity: 0;
      cursor: pointer;
      height: 100%;
      margin: 0;
    }

    .thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      box-shadow:
        0 2px 6px rgba(26, 29, 46, 0.18),
        0 0 0 1px var(--ink-200);
      pointer-events: none;
    }

    .hints {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--ink-600);
    }
  `;

  private _onChange(e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    this.dispatchEvent(
      new CustomEvent<number>("length-change", {
        detail: value,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const pct = ((this.value - this.min) / (this.max - this.min)) * 100;

    return html`
      <div class="header">
        <span class="label">Length</span>
        <span class="value">${this.value}</span>
      </div>

      <div class="slider-wrap">
        <div class="slider-fill" style="width: ${pct}%"></div>
        <div class="thumb" style="left: ${pct}%"></div>
        <input type="range" min=${this.min} max=${this.max} .value=${String(this.value)} @input=${this._onChange} />
      </div>

      ${this.hints
        ? html` <div class="hints">
            <span>${this.min}</span>
            <span>min</span>
            <span>·</span>
            <span>recommended</span>
            <span>${this.max}</span>
          </div>`
        : ""}
    `;
  }
}
