import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Platform } from "@/shared/utils/platforms";

import "@icons/check";
import "@icons/cross";

interface Rule {
  label: string;
  pass: boolean;
}

function evalRules(password: string, platform: Platform): Rule[] {
  return [
    { label: `At least ${platform.minLength} characters`, pass: password.length >= platform.minLength },
    { label: "Mixed case", pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "At least one number", pass: /\d/.test(password) },
    { label: "At least one symbol", pass: /[^a-zA-Z0-9]/.test(password) },
  ];
}

@customElement("pass-platform-rules-check")
export class PassPlatformRulesCheck extends LitElement {
  @property() password = "";
  @property({ attribute: false }) platform!: Platform;

  static styles = css`
    :host {
      display: block;
    }

    /* ── header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
    }

    .score {
      display: inline-flex;
      align-items: center;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      background: var(--mint-soft);
      color: var(--mint);
    }

    .score.partial {
      background: var(--warn-soft);
      color: var(--warn);
    }

    .score.fail {
      background: var(--danger-soft);
      color: var(--danger);
    }

    /* ── list ── */
    .list {
      display: flex;
      flex-direction: column;
    }

    .rule {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--ink-100);
      font-size: 13.5px;
      color: var(--ink-800);
    }

    .rule:last-child {
      border-bottom: none;
    }

    .dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--mint);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 200ms;
    }

    .rule.fail .dot {
      background: var(--danger);
    }
    .rule.fail {
      color: var(--ink-500);
    }

    .rule-label {
      flex: 1;
    }

    /* ── tip ── */
    .tip {
      margin-top: 20px;
      padding: 14px;
      border-radius: 12px;
      background: var(--cream-100);
      display: flex;
      gap: 10px;
    }

    .tip-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--coral-deep);
      margin-top: 1px;
      flex-shrink: 0;
    }

    .tip-text {
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--ink-700);
    }
  `;

  override render() {
    const rules = evalRules(this.password, this.platform);
    const passed = rules.filter((r) => r.pass).length;
    const total = rules.length;

    const scoreClass = passed === total ? "" : passed >= total / 2 ? "partial" : "fail";

    return html`
      <div class="header">
        <span class="title">Rule check</span>
        <span class="score ${scoreClass}">${passed} of ${total}</span>
      </div>

      <div class="list">
        ${rules.map(
          (r) => html`
            <div class="rule ${r.pass ? "" : "fail"}">
              <span class="dot">
                ${r.pass
                  ? html`<check-icon width="12" height="12"></check-icon>`
                  : html`<cross-icon width="12" height="12"></cross-icon>`}
              </span>
              <span class="rule-label">${r.label}</span>
            </div>
          `,
        )}
      </div>
    `;
  }
}
