import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

export class PasswordChangeEvent extends Event {
  static readonly TYPE = "password-change";
  constructor(public readonly password: string) {
    super(PasswordChangeEvent.TYPE, { bubbles: true, composed: true });
  }
}

@customElement("pass-health-input")
export class PassHealthInput extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-mono);
      font-size: 15px;
      background: var(--cream-50);
      color: var(--ink-900);
      outline: none;
      padding: 14px 16px;
      border: 1.5px solid var(--platform-color, --coral);
      box-shadow: 0 0 0 3px var(--coral-soft);
      border-radius: 14px;
      transition: border-color 0.5s;
      transition: box-shadow 0.5s;
    }

    input:focus {
      border-color: var(--accent-500);
      box-shadow: none;
    }

    input::placeholder {
      color: var(--ink-400);
    }
  `;

  @property({ type: Number }) debounce = 400;
  @property({ type: String }) search!: string;
  @property() placeholder = "Type or paste a password…";

  private _timer: ReturnType<typeof setTimeout> | null = null;

  private _clearTimer() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearTimer();
  }

  private _handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;

    this._clearTimer();

    this._timer = setTimeout(() => {
      this._timer = null;
      this.dispatchEvent(new PasswordChangeEvent(value));
    }, this.debounce);
  }

  override render() {
    return html`
      <input
        type="text"
        .value=${this.search}
        autocomplete="off"
        spellcheck="false"
        placeholder=${this.placeholder}
        @input=${this._handleInput}
      />
    `;
  }
}
