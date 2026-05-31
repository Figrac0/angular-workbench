import {
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';

/**
 * Thin, reactive wrapper around Chart.js. Pass a full `ChartConfiguration`;
 * the component creates the chart once and patches data/options on change,
 * recreating it only when the chart `type` actually changes.
 *
 * Size the chart from the parent by setting a height on `app-chart`.
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class ChartComponent implements OnDestroy {
  readonly config = input.required<ChartConfiguration>();

  private readonly canvas =
    viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private chart?: Chart;
  private currentType?: ChartType;

  constructor() {
    effect(() => {
      const config = this.config();
      const canvasRef = this.canvas();
      if (!canvasRef) {
        return;
      }
      this.render(config, canvasRef.nativeElement);
    });
  }

  private render(config: ChartConfiguration, el: HTMLCanvasElement): void {
    const merged: ChartConfiguration = {
      ...config,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...config.options,
      },
    };

    if (this.chart && this.currentType === config.type) {
      this.chart.data = merged.data;
      this.chart.options = merged.options ?? {};
      this.chart.update();
      return;
    }

    this.chart?.destroy();
    this.chart = new Chart(el, merged);
    this.currentType = config.type;
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
