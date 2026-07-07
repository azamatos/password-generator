import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { checkBreach } from "@/shared/utils/hibp";

// icons
import "@icons/spinner";
import "@icons/check";
import "@icons/warning";
import "@icons/info";

type ScanState = "scanning" | "clean" | "breached" | "error";

@customElement("pass-breach-scan")
export class PassBreachScan extends LitElement {
  @property() password = "";

  @state() private _state: ScanState = "scanning";
  @state() private _count = 0;

  private _debounceTimer?: ReturnType<typeof setTimeout>;
  private _scannedPassword = "";

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }

    .body {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon--scanning {
      background: var(--ink-100);
      color: var(--ink-400);
    }

    .icon--clean {
      background: var(--mint-soft);
      color: var(--mint);
    }

    .icon--breached {
      background: var(--danger-soft);
      color: var(--danger);
    }

    .icon--error {
      background: var(--ink-100);
      color: var(--ink-400);
    }

    .message {
      flex: 1;
      min-width: 0;
    }

    .message-text {
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-700);
      line-height: 1.4;
    }

    .message-sub {
      font-size: 11.5px;
      font-family: var(--font-mono);
      color: var(--ink-400);
      margin-top: 2px;
    }
  `;

  override updated(changed: Map<string, unknown>) {
    if (!changed.has("password")) return;
    if (this.password === this._scannedPassword) return;

    clearTimeout(this._debounceTimer);
    this._state = "scanning";

    if (!this.password) return;

    this._debounceTimer = setTimeout(() => this._scan(), 600);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._debounceTimer);
  }

  private async _scan() {
    const password = this.password;
    try {
      const result = await checkBreach(password);
      if (password !== this.password) return; // stale result, new password arrived
      this._scannedPassword = password;
      this._state = result.breached ? "breached" : "clean";
      this._count = result.count;
      this.dispatchEvent(
        new CustomEvent("breach-result", {
          detail: { breached: result.breached, count: result.count },
          bubbles: true,
          composed: true,
        }),
      );
    } catch {
      if (password !== this.password) return;
      this._scannedPassword = password;
      this._state = "error";
      this.dispatchEvent(new CustomEvent("breach-error", { bubbles: true, composed: true }));
    }
  }

  override render() {
    return html`
      <div class="header">
        <span class="title">Breach check</span>
        ${this._renderChip()}
      </div>
      <div class="body">
        ${this._renderIcon()}
        <div class="message">${this._renderMessage()}</div>
      </div>
    `;
  }

  private _renderChip() {
    switch (this._state) {
      case "scanning":
        return html`<ui-chip is-upper-case variant="neutral">Scanning</ui-chip>`;
      case "clean":
        return html`<ui-chip is-upper-case variant="success">Clean</ui-chip>`;
      case "breached":
        return html`<ui-chip is-upper-case variant="danger">Breached</ui-chip>`;
      case "error":
        return html`<ui-chip is-upper-case variant="warn">Unknown</ui-chip>`;
    }
  }

  private _renderIcon() {
    switch (this._state) {
      case "scanning":
        return html`<span class="icon icon--scanning"><spinner-icon width="16" height="16"></spinner-icon></span>`;
      case "clean":
        return html`<span class="icon icon--clean"><check-icon width="14" height="14"></check-icon></span>`;
      case "breached":
        return html`<span class="icon icon--breached"><warning-icon width="14" height="14"></warning-icon></span>`;
      case "error":
        return html`<span class="icon icon--error"><info-icon width="14" height="14"></info-icon></span>`;
    }
  }

  private _renderMessage() {
    switch (this._state) {
      case "scanning":
        return html`
          <span class="message-text">Checking against 13B known breach records…</span>
          <div class="message-sub">Can take some time...</div>
        `;
      case "clean":
        return html`
          <span class="message-text">Not found in any known data breach</span>
          <div class="message-sub">via HaveIBeenPwned · k-anonymity</div>
        `;
      case "breached":
        return html`
          <span class="message-text"
            >Found in ${this._count.toLocaleString()} breach records — regenerate recommended</span
          >
          <div class="message-sub">via HaveIBeenPwned · k-anonymity</div>
        `;
      case "error":
        return html`
          <span class="message-text">Couldn't verify — check your connection</span>
          <div class="message-sub">Copy is still available</div>
        `;
    }
  }
}
