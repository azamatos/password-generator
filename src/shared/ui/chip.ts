import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-chip")
export class UIChip extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }

    :host span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: 120ms;
    }

    :host([is-upper-case]) span {
      text-transform: uppercase;
    }

    :host([variant="success"]) span {
      background: var(--mint-soft);
      color: var(--mint);
    }

    :host([variant="warn"]) span {
      background: var(--warn-soft);
      color: var(--warn);
    }

    :host([variant="danger"]) span {
      background: var(--danger-soft);
      color: var(--danger);
    }

    :host([variant="new"]) span {
      background: var(--coral-tint);
      color: var(--coral);
    }

    :host([variant="neutral"]) span {
      background: var(--ink-100);
      color: var(--ink-700);
    }

    :host([variant="soft"]) span {
      background: var(--ink-200);
      color: var(--ink-500);
    }

    :host([variant="bordered"]) span {
      background: white;
      color: var(--ink-700);
      border: 1px solid var(--ink-200);
    }

    :host([variant="primary"]) span {
      background: rgba(255, 255, 255, 0.08);
      color: var(--cream-50);
    }
  `;

  @property({ reflect: true }) variant:
    | "primary"
    | "success"
    | "neutral"
    | "warn"
    | "danger"
    | "new"
    | "soft"
    | "bordered" = "primary";

  @property({ type: Boolean, attribute: "is-upper-case", reflect: true }) isUpperCase = false;

  render() {
    return html`
      <span>
        <slot></slot>
      </span>
    `;
  }
}
