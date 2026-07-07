import { LitElement, css, html } from "lit";
import { customElement, query, queryAll, state } from "lit/decorators.js";

// components
import "@/shared/ui/button";
import "@/shared/ui/logo";

// icons
import "@icons/guard";
import "@icons/settings";
import "@icons/generator";
import "@icons/health";
import "@icons/vault";

// utils
import { normalizePath, platformHref } from "@shared/utils/router";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Generator", icon: "generator" },
  { href: "/vault", label: "Vault", icon: "vault" },
  { href: "/health", label: "Health", icon: "health" },
];

function resolveTab(path: string): number {
  const normalized = normalizePath(path);
  if (normalized === "/" || normalized === "") return 0;
  if (normalized.startsWith("/vault")) return 1;
  if (normalized.startsWith("/health")) return 2;
  return 0;
}

function getNavIcon(name: string) {
  switch (name) {
    case "generator":
      return html`<generator-icon width="14" height="14"></generator-icon>`;
    case "vault":
      return html`<vault-icon width="14" height="14"></vault-icon>`;
    case "health":
      return html`<health-icon width="14" height="14"></health-icon>`;
    default:
      return html``;
  }
}

@customElement("pass-app-header")
export class PassAppHeader extends LitElement {
  @state() private _activeIndex = resolveTab(window.location.pathname);

  @query(".nav-pill") private _pill!: HTMLElement;
  @queryAll(".nav-link") private _links!: NodeListOf<HTMLElement>;

  static styles = css`
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 28px;
      border-bottom: 1px solid var(--ink-200);
      font-family: var(--font-sans);
    }

    nav {
      position: relative;
      background: var(--ink-100);
      border-radius: 999px;
      padding: 4px;
    }

    ul {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      margin: 0;
      padding-inline-start: 0;
      position: relative;
      z-index: 1;
    }

    li {
      display: flex;
    }

    .nav-pill {
      position: absolute;
      top: 4px;
      left: 0;
      height: calc(100% - 8px);
      border-radius: 999px;
      background: var(--ink-900);
      z-index: 0;
      transition:
        transform 280ms cubic-bezier(0.34, 1.2, 0.64, 1),
        width 280ms cubic-bezier(0.34, 1.2, 0.64, 1);
    }

    .nav-link {
      padding: 7px 14px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
      color: var(--ink-900);
      position: relative;
      z-index: 1;
      white-space: nowrap;
      user-select: none;
      cursor: pointer;
      transition: color 200ms;
    }

    .nav-link--active {
      color: var(--cream-50);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("astro:page-load", this._onPageLoad);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("astro:page-load", this._onPageLoad);
  }

  override updated() {
    const activeLink = this._links?.[this._activeIndex];
    if (!activeLink || !this._pill) return;

    const navRect = this.shadowRoot!.querySelector("nav")!.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    this._pill.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
    this._pill.style.width = `${linkRect.width}px`;
  }

  override firstUpdated() {
    requestAnimationFrame(() => {
      this._pill.style.transition = "none";
      this.updated();
      requestAnimationFrame(() => {
        this._pill.style.transition = "";
      });
    });
  }

  private _onPageLoad = () => {
    this._activeIndex = resolveTab(window.location.pathname);
  };

  private _onLinkClick = (e: MouseEvent, href: string) => {
    const full = platformHref(href);
    if (window.location.pathname === full) e.preventDefault();
  };

  override render() {
    return html`
      <header>
        <ui-logo></ui-logo>
        <nav>
          <div class="nav-pill"></div>
          <ul>
            ${NAV_ITEMS.map(
              (item, i) => html`
                <a
                  href=${platformHref(item.href)}
                  class="nav-link ${this._activeIndex === i ? "nav-link--active" : ""}"
                  data-astro-prefetch
                  @click=${(e: MouseEvent) => this._onLinkClick(e, item.href)}
                >
                  ${getNavIcon(item.icon)} ${item.label}
                </a>
              `,
            )}
          </ul>
        </nav>

        <div class="nav-actions">
          <ui-button aria-label="Security" variant="soft" size="sm">
            <guard-icon width="16" height="16"></guard-icon>
          </ui-button>
          <ui-button aria-label="Settings" variant="soft" size="sm">
            <settings-icon width="16" height="16"></settings-icon>
          </ui-button>
        </div>
      </header>
    `;
  }
}
