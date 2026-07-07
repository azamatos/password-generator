import { LitElement, css, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { toast } from "./utils";
import { ToastType } from "./types";

// icons
import "@icons/check";
import "@icons/warning";
import "@icons/cross";
import "@icons/error";
import "@icons/info";

@customElement("ui-toast-provider")
export class UIToastProvider extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      pointer-events: none;
    }

    /* ── Toast shell ────────────────────────────────────────────────────────── */

    .toast {
      pointer-events: all;
      width: 240px;
      background: var(--color-white);
      border-radius: var(--radius-md, 12px);
      border: 1px solid var(--ink-200, #e2e3ec);
      box-shadow:
        0 12px 24px -8px rgba(26, 29, 46, 0.1),
        0 2px 4px rgba(26, 29, 46, 0.06);
      overflow: hidden;
      animation: toast-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .toast--exiting {
      animation: toast-out 300ms cubic-bezier(0.4, 0, 1, 1) both;
    }

    @keyframes toast-in {
      from {
        transform: translateX(calc(100% + 24px));
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes toast-out {
      from {
        transform: translateX(0);
        opacity: 1;
        max-height: 140px;
        margin-bottom: 0;
      }
      to {
        transform: translateX(calc(100% + 24px));
        opacity: 0;
        max-height: 0;
        margin-bottom: -8px;
      }
    }

    /* ── Body ───────────────────────────────────────────────────────────────── */

    .body {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 12px 12px 14px;
    }

    .icon {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      margin-top: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    .message {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink-900, #1a1d2e);
      line-height: 1.3;
    }

    .description {
      font-size: 12px;
      color: var(--ink-600, #565a7e);
      margin-top: 3px;
      line-height: 1.4;
      font-family: var(--font-mono, monospace);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .close {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--ink-400, #a4a7c1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition:
        background 120ms,
        color 120ms;
    }

    .close:hover {
      background: var(--ink-100, #f0f0f5);
      color: var(--ink-700, #3d4163);
    }

    /* ── Progress bar ───────────────────────────────────────────────────────── */

    .progress {
      height: 3px;
      background: var(--ink-100, #f0f0f5);
    }

    .progress-fill {
      height: 100%;
      animation: progress-shrink linear forwards;
    }

    @keyframes progress-shrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    /* ── Variant accent colors ──────────────────────────────────────────────── */

    .toast--success .icon {
      color: var(--mint, #2a8e6c);
    }
    .toast--success .progress-fill {
      background: var(--mint, #2a8e6c);
    }

    .toast--error .icon {
      color: var(--danger, #c4421f);
    }
    .toast--error .progress-fill {
      background: var(--danger, #c4421f);
    }

    .toast--warning .icon {
      color: var(--warn, #c79b2e);
    }
    .toast--warning .progress-fill {
      background: var(--warn, #c79b2e);
    }

    .toast--info .icon {
      color: var(--ink-500, #7a7e9e);
    }
    .toast--info .progress-fill {
      background: var(--ink-500, #7a7e9e);
    }
  `;

  // No timer state here — the service singleton owns all timers and survives navigation.
  // Component is a pure renderer: reconnecting after Astro view transitions is safe.

  private _onStoreChange = () => this.requestUpdate();

  override connectedCallback() {
    super.connectedCallback();
    toast.addEventListener("toast:change", this._onStoreChange);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    toast.removeEventListener("toast:change", this._onStoreChange);
  }

  private _icon(type: ToastType) {
    switch (type) {
      case "success":
        return html`<check-icon width="16" height="16"></check-icon>`;
      case "error":
        return html`<error-icon width="16" height="16"></error-icon>`;
      case "warning":
        return html`<warning-icon width="16" height="16"></warning-icon>`;
      case "info":
        return html`<info-icon width="16" height="16"></info-icon>`;
    }
  }

  override render() {
    return html`
      ${toast.items.map((item) => {
        const elapsed = Date.now() - item.startedAt;
        const remaining = Math.max(0, item.duration - elapsed);

        return html`
          <div
            class="toast toast--${item.type} ${item.exiting ? "toast--exiting" : ""}"
            role="status"
            aria-live="polite"
          >
            <div class="body">
              <span class="icon">${this._icon(item.type)}</span>
              <div class="content">
                <div class="message">${item.message}</div>
                ${item.description ? html`<div class="description">${item.description}</div>` : nothing}
              </div>
              <button class="close" @click=${() => toast.startExit(item.id)} aria-label="Dismiss notification">
                <cross-icon width="12" height="12"></cross-icon>
              </button>
            </div>
            ${item.duration > 0
              ? html`<div class="progress">
                  <div class="progress-fill" style="animation-duration:${remaining}ms;"></div>
                </div>`
              : nothing}
          </div>
        `;
      })}
    `;
  }
}
