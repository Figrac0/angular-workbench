import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js/auto';
import { catchError, debounceTime, of, switchMap, tap } from 'rxjs';

import {
  ConversionResult,
  POPULAR_CURRENCIES,
  RatePoint,
} from '../../core/models/currency.model';
import { CurrencyService } from '../../core/services/currency.service';
import { ThemeService } from '../../core/services/theme.service';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import {
  SelectComponent,
  SelectOption,
} from '../../shared/components/select/select.component';

interface RangeOption {
  label: string;
  days: number;
}

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    ChartComponent,
    LoadingComponent,
    SelectComponent,
  ],
  templateUrl: './converter.component.html',
  styleUrl: './converter.component.css',
})
export class ConverterComponent {
  private readonly currencyService = inject(CurrencyService);
  private readonly themeService = inject(ThemeService);

  protected readonly popular = POPULAR_CURRENCIES;
  protected readonly ranges: RangeOption[] = [
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
  ];

  protected readonly amount = signal(1000);
  protected readonly from = signal('USD');
  protected readonly to = signal(this.currencyService.displayCurrency());
  protected readonly rangeDays = signal(90);

  protected readonly conversionLoading = signal(false);
  protected readonly seriesLoading = signal(false);

  /** Full currency list for the dropdowns. */
  protected readonly currencies = toSignal(
    this.currencyService.getCurrencies().pipe(
      catchError(() =>
        of(
          Object.fromEntries(POPULAR_CURRENCIES.map((c) => [c, c])),
        ),
      ),
    ),
    { initialValue: {} as Record<string, string> },
  );
  protected readonly currencyCodes = computed(() =>
    Object.keys(this.currencies()).sort(),
  );
  protected readonly currencyOptions = computed<SelectOption[]>(() =>
    this.currencyCodes().map((code) => ({ value: code, label: code })),
  );

  /** Live conversion result, recomputed when amount/from/to change. */
  protected readonly result = toSignal(
    toObservable(
      computed(() => ({
        amount: this.amount(),
        from: this.from(),
        to: this.to(),
      })),
    ).pipe(
      debounceTime(300),
      tap(() => this.conversionLoading.set(true)),
      switchMap(({ amount, from, to }) =>
        this.currencyService.convert(amount || 0, from, to).pipe(
          catchError(() => of(null)),
        ),
      ),
      tap(() => this.conversionLoading.set(false)),
    ),
    { initialValue: null as ConversionResult | null },
  );

  /** Historical rate series for the chart. */
  protected readonly series = toSignal(
    toObservable(
      computed(() => ({
        from: this.from(),
        to: this.to(),
        days: this.rangeDays(),
      })),
    ).pipe(
      debounceTime(300),
      tap(() => this.seriesLoading.set(true)),
      switchMap(({ from, to, days }) =>
        from === to
          ? of([] as RatePoint[])
          : this.currencyService
              .getTimeSeries(from, to, days)
              .pipe(catchError(() => of([] as RatePoint[]))),
      ),
      tap(() => this.seriesLoading.set(false)),
    ),
    { initialValue: [] as RatePoint[] },
  );

  /** Summary stats derived from the historical series. */
  protected readonly seriesStats = computed(() => {
    const s = this.series();
    if (s.length < 2) {
      return null;
    }
    const rates = s.map((p) => p.rate);
    const first = rates[0];
    const last = rates[rates.length - 1];
    return {
      min: Math.min(...rates),
      max: Math.max(...rates),
      changePct: ((last - first) / first) * 100,
    };
  });

  protected swap(): void {
    const from = this.from();
    this.from.set(this.to());
    this.to.set(from);
  }

  protected setFrom(code: string): void {
    this.from.set(code);
  }
  protected setTo(code: string): void {
    this.to.set(code);
  }
  protected onAmount(value: string): void {
    this.amount.set(Number(value) || 0);
  }

  protected format(value: number, code: string, digits = 2): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: digits,
    }).format(value);
  }

  protected readonly chart = computed<ChartConfiguration>(() => {
    const s = this.series();
    const dark = this.themeService.theme() === 'dark';
    const text = dark ? '#94a3b8' : '#475569';
    const grid = dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)';
    const up = (this.seriesStats()?.changePct ?? 0) >= 0;
    const color = up ? '#22d3a6' : '#f87171';
    return {
      type: 'line',
      data: {
        labels: s.map((p) => p.date),
        datasets: [
          {
            label: `${this.from()} → ${this.to()}`,
            data: s.map((p) => p.rate),
            borderColor: color,
            backgroundColor: up
              ? 'rgba(34,211,166,0.12)'
              : 'rgba(248,113,113,0.12)',
            fill: true,
            tension: 0.25,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: text, maxTicksLimit: 8, autoSkip: true },
          },
          y: { grid: { color: grid }, ticks: { color: text } },
        },
      },
    };
  });
}
