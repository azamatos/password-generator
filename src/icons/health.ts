import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("health-icon")
export class HealthIcon extends LitElement {
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
        <polyline
          points="3 12 7 12 9 9 11 15 13 12 21 12"
          data-om-id="jsx:/https:/019dfc24-6122-76b0-8e2e-43122101cdb7.claudeusercontent.com/v1/design/projects/019dfc24-6122-76b0-8e2e-43122101cdb7/serve/screens.jsx:2589:16:153"
        ></polyline>
      </svg>
    `;
  }
}
