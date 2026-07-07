import { LitElement, css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";

// icons
import "@icons/search";

export class SearchEvent extends Event {
  static readonly TYPE = "on-search";
  constructor(public readonly value: string) {
    super(SearchEvent.TYPE, { bubbles: true, composed: true });
  }
}

@customElement("pass-search")
export class PassSearch extends LitElement {
  static styles = css`
    .search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 12px;
      background: rgb(255, 255, 255);
      border: 1px solid var(--ink-200);
      margin-bottom: 12px;
      color: var(--ink-500);
    }

    .search input {
      border: none;
      outline: none;
      font-size: 14px;
      flex: 1;
      color: var(--ink-900);
    }

    .hotkey {
      margin-left: auto;
      font-size: 10.5px;
      font-family: var(--font-mono);
      padding: 2px 5px;
      background: var(--ink-100);
      border-radius: 4px;
      color: var(--ink-500);
    }
  `;

  @property() placeholder = "";
  @property({ type: Number }) debounce = 400;

  private _timer: ReturnType<typeof setTimeout> | null = null;

  private _clearTimer() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
    }
  }

  @query("input") private _input!: HTMLInputElement;

  private _onKeydown = (e: KeyboardEvent) => {
    const trigger = navigator.platform.toUpperCase().includes("MAC") ? e.metaKey : e.ctrlKey;

    if (trigger && e.key === "k") {
      e.preventDefault();
      this._input.focus();
      this._input.select();
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKeydown);
    this._clearTimer();
  }

  private _onSearch(e: InputEvent) {
    const value = (e.target as HTMLInputElement).value;

    this._clearTimer();

    this._timer = setTimeout(() => {
      this._timer = null;
      this.dispatchEvent(new SearchEvent(value));
    }, this.debounce);
  }

  override render() {
    return html`
      <div class="search">
        <search-icon width="14" height="14"></search-icon>
        <input placeholder=${this.placeholder} @input=${this._onSearch} />
        <span class="hotkey">⌘K</span>
      </div>
    `;
  }
}
