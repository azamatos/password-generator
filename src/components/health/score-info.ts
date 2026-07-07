import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

// components
import "@components/vault/strength-bar";

// utils
import { ScoreLevel } from "@/shared/types";

@customElement("pass-health-score-info")
export class PassHealthScoreInfo extends LitElement {
  static styles = css`
    .root {
      background: rgb(255, 255, 255);
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }
    .score {
      font-size: 44px;
      font-weight: 500;
      line-height: 1;
      color: var(--warn);
    }

    .score-info {
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--ink-600);
      font-family: var(--font-mono);
      margin-top: 4px;
    }

    .description {
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--ink-600);
    }

    .bar {
      display: flex;
      gap: 5px;
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
    }
  `;

  @property({ type: Number }) level!: ScoreLevel;
  @property({ type: Number }) score!: number;

  override render() {
    return html`
      <div class="root">
        <span class="title">Score</span>
        <span class="score">${this.score}</span>
        <span class="score-info">out of 100 · medium</span>
        <vault-strength-bar .level=${this.level}></vault-strength-bar>
        <span class="description"> This score based on <strong>zxcvbn</strong> - password strength estimator </span>
      </div>
    `;
  }
}
