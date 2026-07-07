import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

// ui
import "@/shared/ui/chip";

// types
import { Platform } from "@/shared/types";

@customElement("pass-platform-banner")
export class PassPlatformBanner extends LitElement {
  @property({ attribute: false }) platform!: Platform;

  static styles = css`
    :host {
      display: block;
    }

    .banner {
      position: relative;
      padding: 20px 48px;
      border-radius: 24px;
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--platform-color) 18%, var(--cream-50)) 0%,
        var(--cream-50) 100%
      );
      border-bottom: 1px solid var(--ink-200);
    }

    .inner {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 40px;
      align-items: center;
    }

    h1 {
      font-family: var(--font-display);
      font-size: 64px;
      line-height: 1;
      margin: 0;
      color: var(--ink-900);
      letter-spacing: -0.02em;
    }

    .requirements {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `;

  override render() {
    if (!this.platform) {
      return null;
    }

    return html`
      <div class="banner">
        <div class="inner">
          <h1>${this.platform.name}</h1>
          <img src="/icons/${this.platform.icon}" alt="${this.platform.name} logo" width="120" height="120" />
        </div>

        <div class="requirements">
          ${this.platform.requirements.map((p) => html`<ui-chip is-upper-case variant="bordered">${p.label}</ui-chip>`)}
        </div>
      </div>
    `;
  }
}
