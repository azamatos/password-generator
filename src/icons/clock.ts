import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("clock-icon")
export class ClockIcon extends LitElement {
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
        <circle cx="12" cy="12" r="9"></circle>
        <polyline points="12 7 12 12 15 14"></polyline>
      </svg>
    `;
  }
}
