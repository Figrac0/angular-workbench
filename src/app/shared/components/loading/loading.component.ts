import { Component, input } from '@angular/core';

/** Lightweight inline loading indicator with an optional message. */
@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading" role="status" aria-live="polite">
      <span class="loading__spinner"></span>
      <span class="loading__label">{{ message() }}</span>
    </div>
  `,
  styles: [
    `
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 2rem 1rem;
        color: var(--text-muted);
      }
      .loading__spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2.5px solid var(--border);
        border-top-color: var(--brand);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .loading__label {
        font-size: 0.9rem;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingComponent {
  readonly message = input<string>('Loading…');
}
