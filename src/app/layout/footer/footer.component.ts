import { Component } from '@angular/core';

/** App footer with attribution and live data-source credits. */
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <p class="footer__brand">
          <span class="footer__mark">◈</span> FinScope
          <span class="footer__muted">— investment & markets toolkit</span>
        </p>
        <p class="footer__muted">
          Live FX by
          <a href="https://www.frankfurter.app" target="_blank" rel="noopener">
            Frankfurter
          </a>
          · Crypto by
          <a href="https://www.coingecko.com" target="_blank" rel="noopener">
            CoinGecko
          </a>
        </p>
        <p class="footer__muted footer__disclaimer">
          For educational purposes only — not financial advice.
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        margin-top: 4rem;
        border-top: 1px solid var(--border);
        background: var(--surface);
      }
      .footer__inner {
        max-width: 1180px;
        margin: 0 auto;
        padding: 1.5rem 1.25rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1.5rem;
        font-size: 0.85rem;
      }
      .footer__brand {
        font-weight: 700;
        color: var(--text);
        margin: 0;
      }
      .footer__mark {
        color: var(--brand);
      }
      .footer__muted {
        color: var(--text-muted);
        margin: 0;
      }
      .footer__muted a {
        color: var(--brand);
      }
      .footer__disclaimer {
        margin-left: auto;
        font-size: 0.78rem;
        opacity: 0.8;
      }
    `,
  ],
})
export class FooterComponent {}
