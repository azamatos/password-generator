import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { type ModalSize } from "./types";
import { MODAL_EXIT_MS } from "./constants";

// icons
import "@icons/cross";

/**
 * Declarative modal with slot-based body and footer.
 *
 * Usage:
 *   <ui-modal title="Export backup" ?open=${this._open} @modal-close=${this._onClose}>
 *     <!-- default slot → body -->
 *     <p>Modal body goes here.</p>
 *
 *     <!-- named "footer" slot → action bar -->
 *     <div slot="footer">
 *       <ui-button variant="ghost" @click=${this._onClose}>Cancel</ui-button>
 *       <ui-button variant="primary" @click=${this._confirm}>Confirm</ui-button>
 *     </div>
 *   </ui-modal>
 *
 * Events:
 *   modal-close — fired on backdrop click, ESC key, or × button
 */
@customElement("ui-modal")
export class UIModal extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    /* ── Backdrop ───────────────────────────────────────────────────────────── */

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(26, 29, 46, 0.44);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: backdrop-in 200ms ease both;
    }

    .backdrop--closing {
      animation: backdrop-out 220ms ease both;
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes backdrop-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    /* ── Panel ──────────────────────────────────────────────────────────────── */

    .panel {
      position: relative;
      width: 100%;
      max-width: 560px; /* md default */
      background: #fff;
      border-radius: var(--radius-xl, 24px);
      box-shadow:
        0 24px 48px -12px rgba(26, 29, 46, 0.22),
        0 4px 8px rgba(26, 29, 46, 0.06);
      display: flex;
      flex-direction: column;
      max-height: calc(100dvh - 48px);
      outline: none;
      animation: modal-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .backdrop--closing .panel {
      animation: modal-out 220ms cubic-bezier(0.4, 0, 1, 1) both;
    }

    @keyframes modal-in {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes modal-out {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
    }

    /* ── Size variants ──────────────────────────────────────────────────────── */

    .panel--sm { max-width: 440px; }
    .panel--md { max-width: 560px; }
    .panel--lg { max-width: 720px; }

    /* ── Header ─────────────────────────────────────────────────────────────── */

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 24px 24px 0;
      flex-shrink: 0;
    }

    .header-main {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .title-group {
      flex: 1;
      min-width: 0;
    }

    .title {
      font-size: 18px;
      font-weight: 700;
      color: var(--ink-900);
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin: 0;
    }

    .description {
      font-size: 13px;
      color: var(--ink-500);
      margin-top: 4px;
      line-height: 1.5;
    }

    .close-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 8px);
      border: 1px solid var(--ink-200);
      background: transparent;
      color: var(--ink-500);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background 120ms, color 120ms, border-color 120ms;
      margin-top: -2px;
    }

    .close-btn:hover {
      background: var(--ink-100);
      color: var(--ink-700);
      border-color: var(--ink-300);
    }

    /* ── Body ───────────────────────────────────────────────────────────────── */

    .body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
      /* Subtle scrollbar */
      scrollbar-width: thin;
      scrollbar-color: var(--ink-200) transparent;
    }

    .body::-webkit-scrollbar { width: 4px; }
    .body::-webkit-scrollbar-track { background: transparent; }
    .body::-webkit-scrollbar-thumb { background: var(--ink-200); border-radius: 99px; }

    /* ── Footer ─────────────────────────────────────────────────────────────── */

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px 24px;
      border-top: 1px solid var(--ink-100);
      flex-shrink: 0;
    }

    .footer[hidden] {
      display: none;
    }
  `;

  @property() title = "";
  @property() description?: string;
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ reflect: true }) size: ModalSize = "md";
  /** If false, backdrop click and ESC do nothing. */
  @property({ type: Boolean }) dismissable = true;

  @state() private _visible = false;
  @state() private _closing = false;
  @state() private _hasFooter = false;

  private _closeTimer?: ReturnType<typeof setTimeout>;
  private _prevFocus: Element | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.open && this.dismissable) this._close();
  };

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._onKeyDown);
    clearTimeout(this._closeTimer);
    // Always restore scroll on unmount
    document.body.style.overflow = "";
  }

  override updated(changed: Map<string, unknown>) {
    if (!changed.has("open")) return;

    if (this.open) {
      clearTimeout(this._closeTimer);
      this._closing = false;
      this._visible = true;
      this._prevFocus = document.activeElement;
      document.body.style.overflow = "hidden";
      // Focus the panel after render so ESC/tab work immediately
      this.updateComplete.then(() => {
        (this.shadowRoot?.querySelector(".panel") as HTMLElement)?.focus();
      });
    } else if (this._visible) {
      this._closing = true;
      document.body.style.overflow = "";
      clearTimeout(this._closeTimer);
      this._closeTimer = setTimeout(() => {
        this._visible = false;
        this._closing = false;
        (this._prevFocus as HTMLElement | null)?.focus();
      }, MODAL_EXIT_MS);
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  private _close() {
    this.dispatchEvent(new CustomEvent("modal-close", { bubbles: true, composed: true }));
  }

  private _onBackdropClick() {
    if (this.dismissable) this._close();
  }

  private _onFooterSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasFooter = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  override render() {
    if (!this._visible) return nothing;

    return html`
      <div
        class="backdrop ${this._closing ? "backdrop--closing" : ""}"
        @click=${this._onBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label=${this.title}
      >
        <!-- Stop clicks on the panel from bubbling to the backdrop -->
        <div
          class="panel panel--${this.size}"
          @click=${(e: Event) => e.stopPropagation()}
          tabindex="-1"
        >
          <!-- Header -->
          <div class="header">
            <div class="header-main">
              <div class="title-group">
                <h2 class="title">${this.title}</h2>
                ${this.description
                  ? html`<p class="description">${this.description}</p>`
                  : nothing}
              </div>
              <!-- Optional right-side header content (badge, status, etc.) -->
              <slot name="header-extra"></slot>
            </div>
            <button
              class="close-btn"
              @click=${this._close}
              aria-label="Close modal"
            >
              <cross-icon width="12" height="12"></cross-icon>
            </button>
          </div>

          <!-- Body -->
          <div class="body">
            <slot></slot>
          </div>

          <!-- Footer — hidden when slot is empty -->
          <div class="footer" ?hidden=${!this._hasFooter}>
            <slot
              name="footer"
              @slotchange=${this._onFooterSlotChange}
            ></slot>
          </div>
        </div>
      </div>
    `;
  }
}
