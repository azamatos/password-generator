import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-button")
export class UIButton extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }

    button {
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
      padding: 0;
      margin: 0;
    }

    :host button {
      border-radius: var(--radius-md);
      padding: 11px 16px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.005em;
      cursor: pointer;
      transition: 120ms;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    :host([variant="primary"]) button {
      background: var(--ink-900);
      color: var(--cream-50);
    }

    :host([variant="platform"]) button {
      background: var(--platform-color);
      color: var(--color-dark);
    }

    :host([variant="neutral"]) button {
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.06);
      color: var(--cream-50);
    }

    :host([variant="accent"]) button {
      background: var(--coral);
      color: var(--ink-950);
    }

    :host([variant="accent-white"]) button {
      background: var(--coral);
      color: var(--color-white);
    }

    :host([variant="soft"]) button {
      background: var(--ink-100);
      color: var(--ink-900);
    }

    :host([variant="ghost"]) button {
      border: 1px solid var(--ink-200);
      background: transparent;
      color: var(--ink-700);
    }

    :host([disabled]) button {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([loading]) button {
      cursor: wait;
    }

    :host([size="sm"]) button {
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.8125rem;
    }

    :host([size="xs"]) button {
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.8125rem;
    }

    :host([size="md"]) button {
      padding: 14px 20px;
      font-size: 0.9375rem;
    }

    :host([size="lg"]) button {
      padding: 16px 20px;
      font-size: 1.0625rem;
    }

    :host([size="icon"]) button {
      padding: 8px;
      border-radius: var(--radius-sm);
      font-size: 1.0625rem;
    }

    :host([fullWidth]) {
      width: 100%;
    }

    :host([fullWidth]) button {
      width: 100%;
    }

    :host span {
      font-family: inherit;
      font-weight: 600;
      letter-spacing: -0.005em;
      cursor: pointer;
      font-size: 14px;
    }
  `;

  @property({ reflect: true }) variant:
    | "primary"
    | "neutral"
    | "accent"
    | "accent-white"
    | "soft"
    | "ghost"
    | "platform"
    | "custom" = "custom";
  @property({ reflect: true }) size: "xs" | "sm" | "md" | "lg" | "icon" = "md";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean, reflect: true }) fullWidth = false;

  render() {
    return html`
      <button>
        <slot></slot>
      </button>
    `;
  }
}
