import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("copy-icon")
export class CopyIcon extends LitElement {
  @property() width: string = "24";
  @property() height: string = "24";
  @property() fill: string = "none";
  @property() stroke: string = "currentColor";
  @property() strokeWidth: string = "2";

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
  `;

  render() {
    return html`
      <svg
        width=${this.width}
        height=${this.height}
        viewBox="0 0 24 24"
        fill=${this.fill}
        stroke=${this.stroke}
        stroke-width=${this.strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="9" y="9" width="11" height="11" rx="2"></rect>
        <path d="M5 15V5a2 2 0 0 1 2-2h10"></path>
      </svg>
    `;
  }
}
