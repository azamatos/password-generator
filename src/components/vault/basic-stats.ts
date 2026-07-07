import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

type Stats = {
  saved: number;
  strongest: number | null;
  oldestLabel: string | null;
  breachedCount: number;
};

@customElement("pass-platform-vault-stats")
export class PassPlatformVaultStats extends LitElement {
  static styles = css`
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
    .stat-card {
      background: #fff;
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }
    .stat-value {
      font-family: var(--font-mono);
      font-size: 22px;
      font-weight: 500;
      color: var(--ink-900);
    }
    .stat-value--danger {
      color: var(--danger, #c0392b);
    }
  `;

  @property({ attribute: false }) stats!: Stats;

  override render() {
    return html`
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Saved</div>
          <div class="stat-value">${this.stats.saved}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Strongest</div>
          <div class="stat-value">${this.stats.strongest != null ? `${this.stats.strongest} bits` : "—"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Oldest</div>
          <div class="stat-value">${this.stats.oldestLabel ?? "—"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Breached</div>
          <div class="stat-value ${this.stats.breachedCount > 0 ? "stat-value--danger" : ""}">
            ${this.stats.breachedCount}
          </div>
        </div>
      </div>
    `;
  }
}
