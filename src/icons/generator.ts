import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("generator-icon")
export class GeneratorIcon extends LitElement {
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
        <circle cx="8" cy="15" r="4"></circle>
        <path d="m11 12 9-9 3 3-3 3-2-2-3 3-2-2-2 2"></path>
      </svg>
    `;
  }
}
