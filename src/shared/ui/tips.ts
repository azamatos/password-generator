import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("pass-tips")
export class PassTips extends LitElement {
  @property() title = "";
  @property({ attribute: false }) tips: string[] = [];

  static styles = css`
    :host {
      display: block;
    }

    .title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 14px;
    }

    .item {
      display: flex;
      gap: 12px;
    }

    .number {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--ink-100);
      color: var(--ink-700);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 11px;
    }

    .text {
      font-size: 13.5px;
      color: var(--ink-700);
      line-height: 1.5;
    }
  `;

  override render() {
    if (!this.tips.length) return null;

    return html`
      <span class="title">tips for ${this.title}</span>
      <div class="list">
        ${this.tips.map(
          (tip, i) => html`
            <div class="item">
              <span class="number">${i + 1}</span>
              <span class="text">${tip}</span>
            </div>
          `,
        )}
      </div>
    `;
  }
}
