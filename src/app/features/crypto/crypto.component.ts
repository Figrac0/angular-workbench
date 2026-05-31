import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js/auto';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  merge,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs';

import {
  CHART_RANGES,
  CoinMarket,
  PricePoint,
} from '../../core/models/crypto.model';
import { CryptoService } from '../../core/services/crypto.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ThemeService } from '../../core/services/theme.service';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';

const REFRESH_MS = 60_000;

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ChartComponent,
    LoadingComponent,
    SparklineComponent,
  ],
  templateUrl: './crypto.component.html',
  styleUrl: './crypto.component.css',
})
export class CryptoComponent {
  private readonly cryptoService = inject(CryptoService);
  private readonly currencyService = inject(CurrencyService);
  private readonly themeService = inject(ThemeService);

  protected readonly ranges = CHART_RANGES;
  protected readonly vsCurrency = this.currencyService.displayCurrency;

  protected readonly marketsLoading = signal(false);
  protected readonly chartLoading = signal(false);
  protected readonly search = signal('');
  protected readonly selectedId = signal('bitcoin');
  protected readonly rangeDays = signal(30);
  protected readonly lastUpdated = signal<Date | null>(null);

  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  /** Top coins by market cap; refreshes on currency change, timer and manual reload. */
  protected readonly markets = toSignal(
    combineLatest([
      toObservable(this.vsCurrency),
      merge(timer(0, REFRESH_MS), this.refresh$),
    ]).pipe(
      tap(() => this.marketsLoading.set(true)),
      switchMap(([vs]) =>
        this.cryptoService.getMarkets(vs, 30).pipe(catchError(() => of([] as CoinMarket[]))),
      ),
      tap((list) => {
        this.marketsLoading.set(false);
        if (list.length) {
          this.lastUpdated.set(new Date());
        }
      }),
    ),
    { initialValue: [] as CoinMarket[] },
  );

  protected readonly filteredMarkets = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.markets();
    if (!term) {
      return list;
    }
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.symbol.toLowerCase().includes(term),
    );
  });

  protected readonly selectedCoin = computed<CoinMarket | undefined>(() =>
    this.markets().find((c) => c.id === this.selectedId()),
  );

  /** Aggregate market stats for the header strip. */
  protected readonly totals = computed(() => {
    const list = this.markets();
    return {
      marketCap: list.reduce((sum, c) => sum + (c.market_cap ?? 0), 0),
      volume: list.reduce((sum, c) => sum + (c.total_volume ?? 0), 0),
      count: list.length,
    };
  });

  /** Detail price series for the selected coin / range / currency. */
  protected readonly series = toSignal(
    toObservable(
      computed(() => ({
        id: this.selectedId(),
        days: this.rangeDays(),
        vs: this.vsCurrency(),
      })),
    ).pipe(
      tap(() => this.chartLoading.set(true)),
      switchMap(({ id, days, vs }) =>
        this.cryptoService
          .getMarketChart(id, days, vs)
          .pipe(catchError(() => of([] as PricePoint[]))),
      ),
      tap(() => this.chartLoading.set(false)),
    ),
    { initialValue: [] as PricePoint[] },
  );

  protected select(id: string): void {
    this.selectedId.set(id);
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  // ---- Formatting ----------------------------------------------------------

  protected formatPrice(value: number): string {
    const digits = value >= 1 ? 2 : value >= 0.01 ? 4 : 8;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.vsCurrency(),
      maximumFractionDigits: digits,
    }).format(value);
  }

  protected formatCompact(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.vsCurrency(),
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected pct(value: number | undefined): string {
    if (value == null) {
      return '—';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  // ---- Detail chart --------------------------------------------------------

  protected readonly chart = computed<ChartConfiguration>(() => {
    const s = this.series();
    const dark = this.themeService.theme() === 'dark';
    const text = dark ? '#94a3b8' : '#475569';
    const grid = dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)';
    const up = s.length > 1 ? s[s.length - 1].price >= s[0].price : true;
    const color = up ? '#22d3a6' : '#f87171';
    const days = this.rangeDays();

    return {
      type: 'line',
      data: {
        labels: s.map((p) => this.formatTimestamp(p.timestamp, days)),
        datasets: [
          {
            label: this.selectedCoin()?.name ?? 'Price',
            data: s.map((p) => p.price),
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => this.formatPrice(Number(ctx.parsed.y)),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: text, maxTicksLimit: 8, autoSkip: true },
          },
          y: {
            grid: { color: grid },
            ticks: {
              color: text,
              callback: (v) => this.formatCompact(Number(v)),
            },
          },
        },
      },
    };
  });

  private formatTimestamp(ts: number, days: number): string {
    const d = new Date(ts);
    if (days <= 1) {
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
