import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { type VaultEntry } from "@/shared/stores/vault";
import { getPlatformById } from "@/shared/utils/platforms";

// components
import "./strength-bar";

// ui
import "@shared/ui/avatar";
import "@shared/ui/button";
import "@shared/ui/chip";

// icons
import "@icons/clock";
import "@icons/opened-eye";
import "@icons/closed-eye";
import "@icons/delete";
import "@icons/copy";
import "@icons/check";

// utils
import { timeAgo } from "@/shared/utils/date";
import { toast } from "@/widgets/toast/utils";

@customElement("vault-entry-row")
export class VaultEntryRow extends LitElement {
  static styles = css`
    :host {
      display: block;
      cursor: pointer;
    }

    .row {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 12px;
      background: #fff;
      border: 1px solid var(--ink-100);
      transition:
        border-color 160ms,
        background 160ms;

      &:hover {
        border-color: var(--ink-300);
        background: var(--ink-50, #fafafa);
      }

      &:has(.actions ui-button:hover) {
        border-color: var(--ink-100);
        outline: 2px solid var(--platform-color);
        background: #fff;
      }
    }

    .row--selected {
      border-color: var(--platform-color) !important;
      outline: 2px solid var(--platform-color);
      background: var(--ink-50, #fafafa);
    }

    .info {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .header-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .name {
      font-size: 13.5px;
      font-weight: 600;
    }

    .meta {
      font-size: 11px;
      color: var(--ink-600);
      font-family: var(--font-mono);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .password {
      font-size: 13.5px;
      color: var(--ink-700);
      letter-spacing: 0.04em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--font-mono);
      transition: color 160ms;
    }

    .password--revealed {
      color: var(--ink-900);
      letter-spacing: 0.06em;
    }

    .bits {
      font-size: 11px;
      color: var(--ink-600);
      font-family: var(--font-mono);
      min-width: 60px;
      text-align: right;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 4px;
    }
  `;

  @property({ attribute: false }) entry!: VaultEntry;
  @property({ type: Boolean }) selected = false;
  @state() private _revealed = false;

  private _emit(name: string, detail: object) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private _toggleReveal() {
    this._revealed = !this._revealed;
  }

  private _onRowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest(".actions")) return;
    this._emit("entry-select", { entry: this.entry });
  }

  override render() {
    const platform = getPlatformById(this.entry.platformId);
    if (!platform) return null;

    const name = platform.name;
    const shortName = platform.short ?? name.slice(0, 2);
    const displayPassword = this._revealed ? this.entry.password : "•".repeat(Math.min(this.entry.password.length, 16));

    return html`
      <div class="row ${this.selected ? "row--selected" : ""}" @click=${this._onRowClick}>
        <pass-platform-avatar size="lg" title=${shortName}></pass-platform-avatar>

        <div class="info">
          <div class="header-row">
            <span class="name">${name}</span>
            <span class="meta">
              <clock-icon width="12" height="12"></clock-icon>
              <span>${timeAgo(this.entry.savedAt)}</span>
            </span>
            ${this.entry.breached ? html`<ui-chip is-upper-case variant="danger">Breached</ui-chip>` : null}
          </div>
          <div class="password ${this._revealed ? "password--revealed" : ""}">${displayPassword}</div>
        </div>

        <span class="bits">${this.entry.bits} bits</span>

        <div style="width: 90px;">
          <vault-strength-bar .score=${this.entry.level} .breached=${this.entry.breached ?? false}></vault-strength-bar>
        </div>

        <div class="actions">
          <ui-button
            size="icon"
            variant=${this._revealed ? "soft" : "primary"}
            @click=${this._toggleReveal}
            title=${this._revealed ? "Hide" : "Reveal"}
          >
            ${this._revealed
              ? html`<opened-eye-icon stroke="var(--ink-600)" width="14" height="14"></opened-eye-icon>`
              : html`<closed-eye-icon stroke="var(--cream-50)" width="14" height="14"></closed-eye-icon>`}
          </ui-button>

          <ui-button
            size="icon"
            variant="soft"
            @click=${() => this._emit("entry-copy", { password: this.entry.password })}
            title="Copy"
          >
            <copy-icon stroke="var(--ink-600)" width="14" height="14"></copy-icon>
          </ui-button>

          <ui-button
            size="icon"
            variant="soft"
            @click=${() => this._emit("entry-delete", { id: this.entry.id })}
            title="Delete"
          >
            <delete-icon stroke="var(--ink-600)" width="14" height="14"></delete-icon>
          </ui-button>
        </div>
      </div>
    `;
  }
}
