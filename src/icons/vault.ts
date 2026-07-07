import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("vault-icon")
export class VaultIcon extends LitElement {
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
        <rect
          x="4"
          y="11"
          width="16"
          height="10"
          rx="2"
          data-om-id="jsx:/https:/019dfc24-6122-76b0-8e2e-43122101cdb7.claudeusercontent.com/v1/design/projects/019dfc24-6122-76b0-8e2e-43122101cdb7/serve/screens.jsx:2344:15:153"
        ></rect>
        <path
          d="M8 11V8a4 4 0 0 1 8 0v3"
          data-om-id="jsx:/https:/019dfc24-6122-76b0-8e2e-43122101cdb7.claudeusercontent.com/v1/design/projects/019dfc24-6122-76b0-8e2e-43122101cdb7/serve/screens.jsx:2394:15:203"
        ></path>
      </svg>
    `;
  }
}
