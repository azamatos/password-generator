import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Platform } from "@/shared/utils/platforms";

// icons
import "@icons/check";
import "@icons/cross";

interface Rule {
  label: string;
  pass: boolean;
}

function evalRules(password: string, platform: Platform): Rule[] {
  return [
    { label: `Min ${platform.minLength} chars`, pass: password.length >= platform.minLength },
    { label: "Mixed case", pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "Has number", pass: /\d/.test(password) },
    { label: "Has symbol", pass: /[^a-zA-Z0-9]/.test(password) },
  ];
}

@customElement("pass-rules-check")
export class PassRulesCheck extends LitElement {
  @property() password = "";
  @property({ attribute: false }) platform!: Platform;

  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
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

    .grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }

    .rule {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-radius: 10px;
      background: var(--mint-soft);
    }

    .rule.fail {
      background: var(--danger-soft);
    }

    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--mint);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .rule.fail .dot {
      background: var(--danger);
    }

    .rule-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--mint);
    }

    .rule.fail .rule-label {
      color: var(--danger);
    }
  `;

  override render() {
    const rules = evalRules(this.password, this.platform);
    const passed = rules.filter((r) => r.pass).length;
    const total = rules.length;

    const scoreClass = passed === total ? "" : passed >= total / 2 ? "partial" : "fail";

    return html`
      <div class="header">
        <span class="title">Live rule check · ${this.platform.name}</span>
        <span class="score ${scoreClass}">${passed} of ${total}</span>
      </div>
      <div class="grid">
        ${rules.map(
          (r) => html`
            <div class="rule ${r.pass ? "" : "fail"}">
              <span class="dot"
                >${r.pass
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
