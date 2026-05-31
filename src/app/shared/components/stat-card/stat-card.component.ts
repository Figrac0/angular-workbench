import { Component, input } from '@angular/core';

/**
 * Compact KPI tile used across feature pages. The optional `delta` shows a
 * coloured up/down chip; `accent` tints the leading icon strip.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <article class="stat-card" [style.--accent]="accent()">
      <div class="stat-card__head">
        <span class="stat-card__label">{{ label() }}</span>
        @if (icon()) {
          <span class="stat-card__icon">{{ icon() }}</span>
        }
      </div>
      <strong class="stat-card__value">{{ value() }}</strong>
      <div class="stat-card__foot">
        @if (delta() !== null && delta() !== undefined) {
          <span
            class="stat-card__delta"
            [class.is-up]="(delta() ?? 0) >= 0"
            [class.is-down]="(delta() ?? 0) < 0"
          >
            {{ (delta() ?? 0) >= 0 ? '▲' : '▼' }}
            {{ formatDelta(delta() ?? 0) }}
          </span>
        }
        @if (hint()) {
          <span class="stat-card__hint">{{ hint() }}</span>
        }
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .stat-card {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 142px;
        padding: 1.15rem 1.25rem;
        border-radius: var(--radius);
        background:
          radial-gradient(
            120% 100% at 100% 0%,
            color-mix(in srgb, var(--accent, var(--brand)) 14%, transparent),
            transparent 60%
          ),
          var(--surface);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
        transition: transform 0.18s ease, box-shadow 0.18s ease,
          border-color 0.18s ease;
      }
      .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-lg);
        border-color: color-mix(in srgb, var(--accent, var(--brand)) 40%, var(--border));
      }
      .stat-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.85rem;
      }
      .stat-card__label {
        font-size: 0.7rem;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        font-weight: 600;
        color: var(--text-muted);
      }
      .stat-card__icon {
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        flex-shrink: 0;
        border-radius: 9px;
        font-size: 0.95rem;
        background: color-mix(in srgb, var(--accent, var(--brand)) 18%, transparent);
      }
      .stat-card__value {
        font-size: 1.6rem;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.02em;
        color: var(--text);
        font-variant-numeric: tabular-nums;
        word-break: break-word;
      }
      .stat-card__foot {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        flex-wrap: wrap;
        margin-top: auto;
        padding-top: 0.85rem;
      }
      .stat-card__delta {
        font-size: 0.76rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
      }
      .stat-card__delta.is-up {
        color: var(--success);
        background: color-mix(in srgb, var(--success) 16%, transparent);
      }
      .stat-card__delta.is-down {
        color: var(--danger);
        background: color-mix(in srgb, var(--danger) 16%, transparent);
      }
      .stat-card__hint {
        font-size: 0.74rem;
        color: var(--text-muted);
      }
    `,
  ],
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input<string>('');
  readonly hint = input<string>('');
  readonly accent = input<string>('var(--brand)');
  /** Optional percentage delta rendered as a coloured chip. */
  readonly delta = input<number | null>(null);

  formatDelta(value: number): string {
    return `${Math.abs(value).toFixed(2)}%`;
  }
}
