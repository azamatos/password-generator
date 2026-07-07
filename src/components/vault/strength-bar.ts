import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { passwordScoreToColor } from "@/shared/utils/scoring";
import { ScoreLevel } from "@/shared/types";

@customElement("vault-strength-bar")
export class VaultStrengthBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .bar {
      display: flex;
      gap: 3px;
    }
    .bar span {
      flex: 1;
      height: 8px;
      border-radius: 999px;
    }
  `;

  @property({ type: Number }) level!: ScoreLevel;
  @property({ type: Boolean }) breached = false;

  override render() {
    const fillColor = this.breached ? "var(--danger)" : passwordScoreToColor(this.level);

    return html`
      <div class="bar">
        ${[0, 1, 2, 3, 4].map(
          (i) => html`<span style="background:${i <= this.level ? fillColor : "var(--ink-200)"};"></span>`,
        )}
      </div>
    `;
  }
}
