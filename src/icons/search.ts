import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("search-icon")
export class SearchIcon extends LitElement {
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
        <circle cx="11" cy="11" r="7"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
    `;
  }
}
