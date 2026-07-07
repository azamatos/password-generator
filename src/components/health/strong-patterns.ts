import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("pass-health-strong-patterns")
export class PassHealthStrongPatterns extends LitElement {
  static styles = css`
    .root {
      background: var(--color-white);
      border-radius: 18px;
      border: 1px solid var(--ink-200);
      box-shadow: var(--shadow-xs);
      padding: 18px;
    }
    .title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-500);
      margin-bottom: 12px;
    }
    .block {
      padding: 10px 0px;
      border-bottom: 1px solid var(--ink-100);
    }

    .block:last-child {
      border-bottom: none;
    }

    .block-lable {
      font-size: 12.5px;
      font-weight: 600;
    }

    .block-subtitle {
      font-size: 11px;
      color: var(--ink-500);
      font-family: var(--font-mono);
      margin-top: 2px;
    }
  `;

  override render() {
    return html`
      <div class="root">
        <span class="title">What we look at</span>
        <div style="display: flex; flex-direction: column; gap: 0px;">
          <div class="block">
            <div class="block-lable">Length</div>
            <div class="block-subtitle">Above 12 chars · entropy</div>
          </div>
          <div class="block">
            <div class="block-lable">Variety</div>
            <div class="block-subtitle">Aa 9 ! mix</div>
          </div>
          <div class="block">
            <div class="block-lable">Patterns</div>
            <div class="block-subtitle">Common words, sequences</div>
          </div>
          <div class="block">
            <div class="block-lable">Breach DB</div>
            <div class="block-subtitle">850M known leaks · k-anon</div>
          </div>
        </div>
      </div>
    `;
  }
}
