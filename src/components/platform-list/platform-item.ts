import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

// ui
import "@shared/ui/avatar";
import { Platform } from "@/shared/types";

@customElement("pass-platform-item")
export class PassPlatformItem extends LitElement {
  @property({ attribute: false }) platform!: Platform;
  @property({ type: Boolean, reflect: true }) selected = false;

  static styles = css`
    .platform-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      background: transparent;
      border: 1px solid transparent;
      box-shadow: none;
      cursor: pointer;
      user-select: none;
      transition: background 0.1s;
    }

    :host([selected]) .platform-card {
      background: var(--color-white);
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
    }

    :host(:not([selected])) .platform-card:hover {
      background: var(--cream-150);
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 7.84px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--cream-100);
      color: var(--ink-700);
      font-family: var(--font-display);
      font-size: 11.76px;
      border: 1.5px solid transparent;
      flex-shrink: 0;
    }

    .metadata {
      flex: 1 1 0%;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .name {
      font-size: 13px;
      font-weight: 600;
    }

    .summary {
      font-size: 10.5px;
      color: var(--ink-500);
      font-family: var(--font-mono);
    }

    .ink {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--coral);
    }
  `;

  override render() {
    return html`
      <div
        class="platform-card"
        role="option"
        aria-selected=${this.selected}
        tabindex="0"
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.click();
          }
        }}
      >
        <pass-platform-avatar title=${this.platform.short ?? this.platform.name.slice(0, 2)}></pass-platform-avatar>
        <div class="metadata">
          <span class="name">${this.platform.name}</span>
          <span class="summary">${this.platform.summary}</span>
        </div>
        ${this.selected ? html`<span class="ink"></span>` : ""}
      </div>
    `;
  }
}
