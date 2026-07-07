import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("spinner-icon")
export class SpinnerIcon extends LitElement {
  @property() width: string = "24";
  @property() height: string = "24";
  @property() stroke: string = "currentColor";
  @property() strokeWidth: string = "2.5";

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }

    svg {
      animation: spin 700ms linear infinite;
      transform-origin: center;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  render() {
    return html`
      <svg
        width=${this.width}
        height=${this.height}
        viewBox="0 0 24 24"
        fill="none"
      >
        <!-- faint track -->
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke=${this.stroke}
          stroke-width=${this.strokeWidth}
          opacity="0.15"
        ></circle>
        <!-- spinning arc (~1/4 of circumference) -->
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke=${this.stroke}
          stroke-width=${this.strokeWidth}
          stroke-linecap="round"
          stroke-dasharray="15.7 47.1"
          fill="none"
        ></circle>
      </svg>
    `;
  }
}
