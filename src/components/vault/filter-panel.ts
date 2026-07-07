import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FilterKey } from "@/shared/stores/vault";

import "@shared/ui/search";

export class FilterEvent extends Event {
  static readonly TYPE = "on-filter";
  constructor(public readonly filter: FilterKey) {
    super(FilterEvent.TYPE, { bubbles: true, composed: true });
  }
}

@customElement("vault-filter-panel")
export class VaultFilterPanel extends LitElement {
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
    .filter-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .filter-item {
      display: flex;
      justify-content: space-between;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      color: var(--ink-700);
      background: transparent;
      border: none;
      font-family: inherit;
      text-align: left;
      transition: background 300ms;
    }
    .filter-item:hover:not(.filter-item--active) {
      background: var(--cream-100);
    }
    .filter-item--active {
      background: var(--ink-900) !important;
      color: var(--cream-50);
      font-weight: 600;
    }
    .count {
      font-family: var(--font-mono);
      opacity: 0.6;
    }
    .filter-item--active .count {
      opacity: 1;
    }
  `;

  @property() filter: FilterKey = "all";
  @property({ attribute: false }) counts = { all: 0, strong: 0, needsAttention: 0 };

  private _setFilter(filter: FilterKey) {
    this.dispatchEvent(new FilterEvent(filter));
  }

  override render() {
    const items: { key: FilterKey; label: string; count: number }[] = [
      { key: "all", label: "All", count: this.counts.all },
      { key: "strong", label: "Strong", count: this.counts.strong },
      { key: "needs-attention", label: "Needs attention", count: this.counts.needsAttention },
    ];

    return html`
      <div class="card">
        <div class="card-label">Filter</div>
        <pass-search aria-placeholder="Search platform" placeholder="Search platform..."></pass-search>
        <div class="filter-list">
          ${items.map(
            ({ key, label, count }) => html`
              <button
                class="filter-item ${this.filter === key ? "filter-item--active" : ""}"
                @click=${() => this._setFilter(key)}
              >
                <span>${label}</span>
                <span class="count">${count}</span>
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }
}
