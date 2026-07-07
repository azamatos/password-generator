import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

export type LoaderSize = "sm" | "md" | "lg";

@customElement("ui-loader")
export class PassUiLoader extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 64px;
    }

    .track {
      border-radius: 50%;
      border-style: solid;
      border-color: var(--ink-100);
      border-top-color: var(--cream-500);
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    :host([size="sm"]) .track {
      width: 14px;
      height: 14px;
      border-width: 2px;
    }
    :host([size="md"]) .track {
      width: 22px;
      height: 22px;
      border-width: 2.5px;
    }
    :host([size="lg"]) .track {
      width: 36px;
      height: 36px;
      border-width: 3px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .track {
        animation: none;
        border-top-color: var(--ink-400);
      }
    }
  `;

  @property({ reflect: true }) size: LoaderSize = "md";

  override render() {
    return html`<div class="track" role="status" aria-label="Loading"></div>`;
  }
}
