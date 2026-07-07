import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

// components
import "@/components/vault/privacy-banner";
import "@/components/vault/entry-list";
import "@/components/vault/filter-panel";
import "@/components/vault/storage-card";
import "@/components/vault/clear-card";

// ui
import "@shared/ui/button";

// icons
import "@icons/regenerate";
import "@icons/warning";
import "@icons/guard";

// utils
import { vault, type FilterKey } from "@/shared/stores/vault";
import { getPlatformById } from "@/shared/utils/platforms";
import { navigateToRoot } from "@/shared/utils/router";

// events
import { FilterEvent } from "@/components/vault/filter-panel";
import { SearchEvent } from "@/shared/ui/search";

@customElement("pass-main-vault")
export class PassMainVault extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .wrapper {
      padding: 24px 56px 0 64px;
    }
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 24px;
    }
    .page-title {
      font-family: var(--font-display);
      font-size: 44px;
      line-height: 1;
      margin: 0;
      letter-spacing: -0.02em;
      color: var(--ink-900);
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 24px;
      align-items: flex-start;
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .main {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .warning {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 12px;
      background: var(--cream-100);
    }

    .warning-title {
      font-size: 12.5px;
      color: var(--ink-700);
      font-weight: 500;
    }
  `;

  @state() private _filter: FilterKey = "all";
  @state() private _search = "";

  private _onStoreChange = () => this.requestUpdate();

  override connectedCallback() {
    super.connectedCallback();
    vault.addEventListener("vault:change", this._onStoreChange);
    vault.init();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    vault.removeEventListener("vault:change", this._onStoreChange);
  }

  private _onSearch(e: SearchEvent) {
    const query = e.value.trim().toLowerCase();

    this._search = query;
  }

  private _onFilter(e: FilterEvent) {
    this._filter = e.filter;
  }

  private get _displayed() {
    let entries = vault.filtered(this._filter);

    if (this._search.trim()) {
      const q = this._search.toLowerCase();
      entries = entries.filter((e) => {
        const p = getPlatformById(e.platformId);
        return (p?.name ?? e.platformId).toLowerCase().includes(q);
      });
    }
    return entries;
  }

  override render() {
    const counts = vault.counts();
    const metrics = vault.storageMetrics();
    const total = vault.entries.length;

    return html`
      <div class="wrapper">
        <div class="page-header">
          <h1 class="page-title">Recent passwords</h1>
          <div class="header-actions">
            <ui-button variant="ghost" @click=${() => vault.exportBackup()} aria-label="Export Backup" size="sm">
              <guard-icon width="14" height="14"></guard-icon>
              Export backup
            </ui-button>
            <ui-button variant="primary" @click=${navigateToRoot} aria-label="Regenerate" size="sm">
              <regenerate-icon width="14" height="14"></regenerate-icon>
              Generate new
            </ui-button>
          </div>
        </div>

        <div class="layout">
          <div class="sidebar">
            <vault-filter-panel
              .filter=${this._filter}
              .counts=${counts}
              @on-filter=${this._onFilter}
              @on-search=${this._onSearch}
            ></vault-filter-panel>

            <vault-storage-card .metrics=${metrics}></vault-storage-card>

            <vault-clear-card .disabled=${total === 0} @vault-clear=${() => vault.clearAll()}></vault-clear-card>
          </div>

          <div class="main">
            <vault-privacy-banner
              title="Stored only in this browser."
              description="Your vault lives in IndexedDB on this device. We never upload it, sync it, or have any way to read it. Export an encrypted backup any time."
              storage="IndexedDB"
            ></vault-privacy-banner>

            <vault-entry-list .entries=${this._displayed} .total=${total}></vault-entry-list>

            <div class="warning">
              <warning-icon width="16" height="16" stroke="var(--coral-deep)"></warning-icon>
              <span class="warning-title">
                This vault is a convenience, not a backup. Save the passwords you actually need to a real password
                manager.
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
