import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("warning-icon")
export class WarningIcon extends LitElement {
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
        <path d="M12 2L2 21h20L12 2z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <circle cx="12" cy="17" r="1" fill="currentColor"></circle>
      </svg>
    `;
  }
}
