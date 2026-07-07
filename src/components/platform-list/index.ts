import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

// components
import "@/shared/ui/search";
import "./platform-item";

// types
import { Platform } from "@/shared/types";
import { SearchEvent } from "@/shared/ui/search";

const DEFAULT_PLATFORMS_LENGTH = 9;

@customElement("pass-platforms-list")
export class PassPlatformsList extends LitElement {
  static styles = css`
    h2 {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
      margin-bottom: 12px;
      padding: 0px 6px;
    }

    .platforms {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 515px;
      overflow: hidden;
      padding-right: 8px;
      margin-right: -8px;
      transition: max-height 300ms ease;
    }

    .platforms.expanded {
      overflow-y: auto;
    }

    .platforms::-webkit-scrollbar {
      width: 4px;
    }

    .platforms::-webkit-scrollbar-track {
      background: transparent;
    }

    .platforms::-webkit-scrollbar-thumb {
      background: var(--ink-200);
      border-radius: 99px;
    }

    .more-btn {
      margin-top: 12px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--ink-500);
      padding: 8px 10px;
      text-align: center;
      width: 100%;
      background: transparent;
      border: 1px dashed var(--ink-200);
      border-radius: 10px;
      cursor: pointer;
      font-family: var(--font-mono);
      transition:
        background 120ms,
        color 120ms;
    }

    .more-btn:hover {
      background: var(--cream-150);
      color: var(--ink-900);
    }
  `;

  @property({ attribute: false }) platforms: Platform[] = [];
  @property() selectedId = "";

  @state() private _filtered: Platform[] = [];
  @state() private _showAll = false;

  @query(".platforms") private _list!: HTMLElement;

  private _onSearch(e: SearchEvent) {
    const query = e.value.trim().toLowerCase();

    this._filtered = query ? this.platforms.filter((p) => p.name.toLowerCase().includes(query)) : this.platforms;

    if (this._showAll) {
      this._showAll = false;
      this._list.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("platforms")) {
      this._filtered = this.platforms;
      this._showAll = false;
    }
  }

  private get _morePlatforms() {
    return Math.max(0, this._filtered.length - DEFAULT_PLATFORMS_LENGTH);
  }

  private get _visible() {
    return this._showAll ? this._filtered : this._filtered.slice(0, DEFAULT_PLATFORMS_LENGTH);
  }

  private _showMore() {
    this._showAll = !this._showAll;

    if (!this._showAll) {
      this._list.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      this.updateComplete.then(() => {
        this._list.scrollTo({ top: this._list.scrollHeight, behavior: "smooth" });
      });
    }
  }

  private _select(id: string) {
    this.dispatchEvent(
      new CustomEvent<string>("platform-select", {
        detail: id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <h2>Platforms · ${this.platforms.length}</h2>
      <pass-search placeholder="Search..." aria-placeholder="Search" @on-search=${this._onSearch}></pass-search>

      <div class="platforms ${this._showAll ? "expanded" : ""}" role="listbox" aria-label="Select platform">
        ${this._visible.length > 0
          ? this._filtered.map(
              (p) => html`
                <pass-platform-item
                  .platform=${p}
                  ?selected=${p.id === this.selectedId}
                  @click=${() => this._select(p.id)}
                ></pass-platform-item>
              `,
            )
          : html`<div class="more"><span>No results</span></div>`}
      </div>

      ${this._morePlatforms > 0
        ? html`
            <button class="more-btn" @click=${this._showMore}>
              ${this._showAll ? "show less" : `+ ${this._morePlatforms} more`}
            </button>
          `
        : ""}
    `;
  }
}
