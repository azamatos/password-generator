import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("closed-eye-icon")
export class ClosedEyeIcon extends LitElement {
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
        <path d="M3 3l18 18"></path>
        <path d="M10.6 10.6a3 3 0 0 0 4 4"></path>
        <path d="M9.4 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.1"></path>
        <path d="M6.5 6.7A18 18 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.3-1"></path>
      </svg>
    `;
  }
}
