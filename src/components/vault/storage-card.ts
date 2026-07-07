import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("vault-storage-card")
export class VaultStorageCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .card {
      background: #fff;
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
      padding: 18px;
    }
    .card-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
      margin-bottom: 10px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .label {
      font-size: 12.5px;
      color: var(--ink-700);
    }
    .value {
      font-size: 12.5px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    .progress-bar {
      height: 4px;
      background: var(--ink-100);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-fill {
      height: 100%;
      background: var(--ink-900);
      border-radius: 999px;
      transition: width 300ms;
    }
    .hint {
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--ink-600);
      font-family: var(--font-mono);
    }
  `;

  @property({ attribute: false })
  metrics = { usedKB: 0, maxKB: 50, pct: 0, remaining: 0 };

  override render() {
    const { usedKB, maxKB, pct, remaining } = this.metrics;
    return html`
      <div class="card">
        <div class="card-label">This device</div>
        <div class="row">
          <span class="label">Storage used</span>
          <span class="value">${usedKB} / ${maxKB} KB</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%;"></div>
        </div>
        <div class="hint">Capacity for ~${remaining} more passwords</div>
      </div>
    `;
  }
}
