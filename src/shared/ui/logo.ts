import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-logo")
export class UILogo extends LitElement {
  static styles = css`
    a {
      text-decoration: none;
      user-select: none;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--ink-900);
    }

    :host .arrow {
      color: var(--coral);
    }

    :host .tilde {
      color: var(--ink-500);
    }

    :host .name {
      color: var(--ink-900);
      letter-spacing: -0.02em;
    }

    :host .cursor {
      width: 7px;
      height: 13px;
      background: var(--ink-900);
      border-radius: 1.5px;
      animation: cursor-blink 1.1s step-end infinite;
    }

    @keyframes cursor-blink {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
    }
  `;

  @property({ reflect: true }) mode: "light" | "dark" = "light";

  override render() {
    return html`
      <a href="/">
        <span class="arrow">➜</span>
        <span class="tilde">~</span>
        <span class="name">azamatos</span>
        <span class="cursor"></span>
      </a>
    `;
  }
}
