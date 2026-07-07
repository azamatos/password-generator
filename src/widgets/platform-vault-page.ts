import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// components
import "@/components/vault/privacy-banner";
import "@/components/vault/selected-card";
import "@/components/vault/basic-stats";
import "@/components/vault/entry-list";
import "@components/platform-banner";

// utils
import { vault, type VaultEntry } from "@/shared/stores/vault";
import { getPlatformById } from "@/shared/utils/platforms";
import { timeAgo } from "@/shared/utils/date";

@customElement("pass-platform-vault")
export class PassPlatformVault extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .container {
      padding-top: 24px;
    }
    .body {
      padding: 32px 56px 0 64px;
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 28px;
      align-items: flex-start;
    }
    .left {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .right {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
  `;

  @property() platformId = "instagram";
  @state() private _selectedEntry: VaultEntry | undefined;

  private _onStoreChange = () => this.requestUpdate();

  override async connectedCallback() {
    super.connectedCallback();
    vault.addEventListener("vault:change", this._onStoreChange);
    await vault.init();
    this._selectedEntry = this._entries[0];
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    vault.removeEventListener("vault:change", this._onStoreChange);
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has("platformId") && this.platformId) {
      this.style.setProperty("--platform-color", `var(--plat-${this.platformId})`);
      this._selectedEntry = this._entries.at(0);
    }
  }

  private get _entries(): VaultEntry[] {
    return vault.entries.filter((e) => e.platformId === this.platformId);
  }

  private _stats() {
    const entries = this._entries;
    if (entries.length === 0) {
      return { saved: 0, strongest: null, oldestLabel: null, breachedCount: 0 };
    }
    const strongest = Math.max(...entries.map((e) => e.bits));
    const oldestTs = Math.min(...entries.map((e) => e.savedAt));
    const breachedCount = entries.filter((e) => e.breached).length;
    return { saved: entries.length, strongest, oldestLabel: timeAgo(oldestTs), breachedCount };
  }

  private _onSelect(e: CustomEvent<{ entry: VaultEntry }>) {
    this._selectedEntry = e.detail.entry;
  }

  override render() {
    const platform = getPlatformById(this.platformId);
    const entries: VaultEntry[] = this._entries;
    const stats = this._stats();

    if (!platform) {
      return null;
    }

    return html`
      <div class="container">
        <pass-platform-banner .platform=${platform}></pass-platform-banner>

        <div class="body">
          <div class="left">
            <vault-entry-list
              .entries=${entries}
              .total=${entries.length}
              .maxEntries=${50}
              .label=${`Your ${platform.name} passwords`}
              .selectedId=${this._selectedEntry?.id ?? null}
              @entry-select=${this._onSelect}
            ></vault-entry-list>
          </div>

          <div class="right">
            <pass-platform-vault-card .entry=${this._selectedEntry}></pass-platform-vault-card>
            <pass-platform-vault-stats .stats=${stats}></pass-platform-vault-stats>
            <vault-privacy-banner
              title="Stored only in this browser"
              description="Your vault lives in IndexedDB on this device. We never upload it, sync it, or have any
              way to read it."
            >
            </vault-privacy-banner>
          </div>
        </div>
      </div>
    `;
  }
}
