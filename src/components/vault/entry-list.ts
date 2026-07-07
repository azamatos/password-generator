import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { vault, type VaultEntry } from "@/shared/stores/vault";

// components
import "./entry-row";

// utils
import { toast } from "@/widgets/toast/utils";

@customElement("vault-entry-list")
export class VaultEntryList extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: #fff;
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
      padding: 20px;
    }
    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }
    .count {
      font-size: 11px;
      color: var(--ink-600);
      font-family: var(--font-mono);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 345px;
      overflow: auto;
      padding: 8px;
      margin-right: -8px;
      transition: max-height 300ms ease;
    }

    .list::-webkit-scrollbar {
      width: 4px;
    }

    .list::-webkit-scrollbar-track {
      background: transparent;
    }

    .list::-webkit-scrollbar-thumb {
      background: var(--ink-200);
      border-radius: 99px;
    }

    .empty {
      padding: 116px 20px;
      text-align: center;
      color: var(--ink-500);
      font-size: 13px;
      line-height: 1.6;
    }
    .empty-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--ink-700);
      margin-bottom: 6px;
    }
  `;

  @property({ attribute: false }) entries: VaultEntry[] = [];

  @property() label = "Saved · sorted by recent";
  @property({ type: Number }) total = 0;
  @property({ type: Number }) maxEntries = 50;
  @property() selectedId: string | null = null;

  private _onCopy(e: CustomEvent<{ password: string }>) {
    navigator.clipboard
      .writeText(e.detail.password)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Copy failed", "Check browser clipboard permissions"));
  }

  private async _onDelete(e: CustomEvent<{ id: string }>) {
    try {
      await vault.remove(e.detail.id);
      toast.success("Password deleted!");
    } catch {
      toast.error("Failed to delete password");
    }
  }

  private _onSelect(e: CustomEvent<{ entry: VaultEntry }>) {
    this.dispatchEvent(
      new CustomEvent("entry-select", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <div class="card">
        <div class="list-header">
          <span class="label">${this.label}</span>
          <span class="count">${this.total} of ${this.maxEntries} max</span>
        </div>
        <div class="list">
          ${this.entries.length === 0
            ? html`
                <div class="empty">
                  <div class="empty-title">No passwords saved yet</div>
                  Generate a password and save it to see it here.
                </div>
              `
            : this.entries.map(
                (entry) => html`
                  <vault-entry-row
                    .entry=${entry}
                    .selected=${this.selectedId === entry.id}
                    @entry-copy=${this._onCopy}
                    @entry-delete=${this._onDelete}
                    @entry-select=${this._onSelect}
                  ></vault-entry-row>
                `,
              )}
        </div>
      </div>
    `;
  }
}
