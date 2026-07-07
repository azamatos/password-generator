import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("pass-platform-avatar")
export class PassPlatformAvatar extends LitElement {
  @property({ attribute: true }) title!: string;
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  static styles = css`
    .avatar {
      border-radius: 7.84px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--cream-100);
      color: var(--ink-700);
      font-family: var(--font-display);
      border: 1.5px solid transparent;
      flex-shrink: 0;
    }

    :host([size="sm"]) .avatar {
      width: 24px;
      height: 24px;
      font-size: 10px;
    }

    :host([size="md"]) .avatar {
      width: 28px;
      height: 28px;
      font-size: 11.76px;
    }

    :host([size="lg"]) .avatar {
      width: 36px;
      height: 36px;
      font-size: 16px;
    }
  `;

  override render() {
    return html` <div class="avatar" data-id=${this.title}>${this.title}</div>`;
  }
}
