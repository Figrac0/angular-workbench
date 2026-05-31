import { Component, computed, input } from '@angular/core';

/**
 * Tiny dependency-free SVG sparkline for dense layouts such as table rows.
 * Auto-scales to its data and colours itself green/red by net direction
 * unless an explicit `color` is supplied.
 */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    <svg
      class="sparkline"
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      @if (areaPath()) {
        <path class="sparkline__area" [attr.d]="areaPath()" [attr.fill]="stroke()" />
      }
      <path
        class="sparkline__line"
        [attr.d]="linePath()"
        fill="none"
        [attr.stroke]="stroke()"
        stroke-width="1.6"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  `,
  styles: [
    `
      .sparkline {
        display: block;
        width: 100%;
        height: 100%;
      }
      .sparkline__area {
        opacity: 0.12;
      }
    `,
  ],
})
export class SparklineComponent {
  readonly data = input<number[]>([]);
  readonly color = input<string>('');

  protected readonly width = 120;
  protected readonly height = 36;

  /** Resolved stroke colour: explicit override, else trend-based. */
  protected readonly stroke = computed(() => {
    if (this.color()) {
      return this.color();
    }
    const d = this.data();
    if (d.length < 2) {
      return 'var(--brand)';
    }
    return d[d.length - 1] >= d[0] ? 'var(--success)' : 'var(--danger)';
  });

  private readonly points = computed(() => {
    const d = this.data();
    if (d.length < 2) {
      return [] as { x: number; y: number }[];
    }
    const min = Math.min(...d);
    const max = Math.max(...d);
    const span = max - min || 1;
    const stepX = this.width / (d.length - 1);
    const pad = 3;
    const usable = this.height - pad * 2;
    return d.map((value, i) => ({
      x: i * stepX,
      y: pad + (1 - (value - min) / span) * usable,
    }));
  });

  protected readonly linePath = computed(() => {
    const pts = this.points();
    if (!pts.length) {
      return '';
    }
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  });

  protected readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) {
      return '';
    }
    const first = pts[0];
    const last = pts[pts.length - 1];
    return (
      `M${first.x.toFixed(2)},${this.height} ` +
      pts.map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') +
      ` L${last.x.toFixed(2)},${this.height} Z`
    );
  });
}
