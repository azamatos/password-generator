import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@shared/ui/chip";

@customElement("vault-privacy-banner")
export class VaultPrivacyBanner extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .banner {
      background: var(--ink-900);
      border-radius: 18px;
      overflow: hidden;
      color: var(--cream-50);
    }
    .inner {
      display: flex;
      gap: 14px;
      padding: 16px 20px;
    }
    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.08);
      color: var(--cream-50);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
    }
    .description {
      font-size: 12.5px;
      color: rgba(247, 240, 225, 0.75);
    }
  `;

  @property({ type: String }) title!: string;
  @property({ type: String }) description!: string;
  @property({ type: String }) storage: string = "";

  override render() {
    return html`
      <div class="banner">
        <div class="inner">
          <div class="icon-wrapper">
          <span class="icon">
            <vault-icon width="16" height="16" ></vault-icon>
            </svg>
          </span>
          </div>
          <div class="body">
            <div class="title">${this.title}</div>
            <div class="description">${this.description}</div>
          </div>
        <div class="badge">
         ${this.storage ? html`<ui-chip>${this.storage}</ui-chip>` : nothing}
         </div>
        </div>
      </div>
    `;
  }
}
