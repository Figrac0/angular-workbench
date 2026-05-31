import { Component, computed, inject } from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ChartConfiguration } from 'chart.js/auto';
import { catchError, debounceTime, filter, of, switchMap } from 'rxjs';

import {
  CompoundingFrequency,
  InvestmentInput,
} from '../../core/models/investment.model';
import { POPULAR_CURRENCIES } from '../../core/models/currency.model';
import { InvestmentService } from '../../core/services/investment.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ThemeService } from '../../core/services/theme.service';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { NumberFieldComponent } from '../../shared/components/number-field/number-field.component';
import {
  SelectComponent,
  SelectOption,
} from '../../shared/components/select/select.component';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ChartComponent,
    StatCardComponent,
    NumberFieldComponent,
    SelectComponent,
  ],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css',
})
export class CalculatorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly investmentService = inject(InvestmentService);
  private readonly currencyService = inject(CurrencyService);
  private readonly themeService = inject(ThemeService);

  protected readonly currencyOptions: SelectOption[] = POPULAR_CURRENCIES.map(
    (code) => ({ value: code, label: code }),
  );
  protected readonly compoundingOptions: SelectOption[] = [
    { value: 'annually', label: 'Annually' },
    { value: 'semiannually', label: 'Semi-annually' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    initialInvestment: [
      this.investmentService.defaults.initialInvestment,
      [Validators.required, Validators.min(0)],
    ],
    annualInvestment: [
      this.investmentService.defaults.annualInvestment,
      [Validators.required, Validators.min(0)],
    ],
    annualInvestmentGrowth: [
      this.investmentService.defaults.annualInvestmentGrowth,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    expectedReturn: [
      this.investmentService.defaults.expectedReturn,
      [Validators.required, Validators.min(-50), Validators.max(100)],
    ],
    duration: [
      this.investmentService.defaults.duration,
      [Validators.required, Validators.min(1), Validators.max(100)],
    ],
    inflationRate: [
      this.investmentService.defaults.inflationRate,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    compounding: [
      this.investmentService.defaults.compounding as CompoundingFrequency,
      Validators.required,
    ],
    currency: [this.investmentService.defaults.currency, Validators.required],
  });

  // Reactive projection state from the service.
  protected readonly rows = this.investmentService.rows;
  protected readonly summary = this.investmentService.summary;
  protected readonly hasResults = this.investmentService.hasResults;
  protected readonly currency = computed(
    () => this.summary()?.currency ?? 'USD',
  );

  /** Live conversion of the final value into other major currencies. */
  protected readonly conversions = toSignal(
    toObservable(this.summary).pipe(
      filter((s) => !!s),
      debounceTime(500),
      switchMap((s) =>
        this.currencyService
          .convertToMany(s!.finalValue, s!.currency, POPULAR_CURRENCIES)
          .pipe(catchError(() => of<Record<string, number>>({}))),
      ),
    ),
    { initialValue: {} as Record<string, number> },
  );

  constructor() {
    // Recalculate live as the user edits (when the form is valid).
    this.form.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe(() => {
        if (this.form.valid) {
          this.investmentService.calculate(this.toInput());
        }
      });
    // Seed an initial projection.
    this.investmentService.calculate(this.toInput());
  }

  private toInput(): InvestmentInput {
    return this.form.getRawValue();
  }

  protected reset(): void {
    this.form.reset(this.investmentService.defaults);
  }

  protected formatCurrency(value: number, fractionDigits = 0): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.currency(),
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: 0,
    }).format(value);
  }

  protected conversionEntries(): { code: string; value: number }[] {
    const map = this.conversions();
    return POPULAR_CURRENCIES.filter(
      (code) => code !== this.currency() && map[code] != null,
    ).map((code) => ({ code, value: map[code] }));
  }

  protected formatConversion(code: string, value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // ---- Chart theming -------------------------------------------------------

  private chartColors() {
    const dark = this.themeService.theme() === 'dark';
    return {
      text: dark ? '#94a3b8' : '#475569',
      grid: dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)',
      value: '#22d3a6',
      contributions: '#60a5fa',
      interest: '#fbbf24',
      real: dark ? '#a78bfa' : '#7c3aed',
    };
  }

  private currencyTick = (value: number | string) =>
    new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(value));

  /** Area chart: nominal value vs invested capital vs real (inflation-adj.) value. */
  protected readonly growthChart = computed<ChartConfiguration>(() => {
    const rows = this.rows();
    const c = this.chartColors();
    const labels = ['0', ...rows.map((r) => `${r.year}`)];
    const initial = this.form.getRawValue().initialInvestment;
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Portfolio value',
            data: [initial, ...rows.map((r) => r.valueEndOfYear)],
            borderColor: c.value,
            backgroundColor: 'rgba(34,211,166,0.14)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Invested capital',
            data: [initial, ...rows.map((r) => r.totalContributions)],
            borderColor: c.contributions,
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Real value (today)',
            data: [initial, ...rows.map((r) => r.realValue)],
            borderColor: c.real,
            borderDash: [5, 4],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: c.text, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${this.formatCurrency(Number(ctx.parsed.y))}`,
            },
          },
        },
        scales: {
          x: { grid: { color: c.grid }, ticks: { color: c.text } },
          y: {
            grid: { color: c.grid },
            ticks: { color: c.text, callback: this.currencyTick },
          },
        },
      },
    };
  });

  /** Stacked bars: yearly contribution vs interest earned. */
  protected readonly breakdownChart = computed<ChartConfiguration>(() => {
    const rows = this.rows();
    const c = this.chartColors();
    return {
      type: 'bar',
      data: {
        labels: rows.map((r) => `${r.year}`),
        datasets: [
          {
            label: 'Contribution',
            data: rows.map((r) => r.annualContribution),
            backgroundColor: c.contributions,
            borderRadius: 3,
            stack: 'flow',
          },
          {
            label: 'Interest',
            data: rows.map((r) => r.interest),
            backgroundColor: c.interest,
            borderRadius: 3,
            stack: 'flow',
          },
        ],
      },
      options: {
        plugins: {
          legend: { labels: { color: c.text, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${this.formatCurrency(Number(ctx.parsed.y))}`,
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { color: c.grid }, ticks: { color: c.text } },
          y: {
            stacked: true,
            grid: { color: c.grid },
            ticks: { color: c.text, callback: this.currencyTick },
          },
        },
      },
    };
  });

  /** Doughnut: final composition of invested capital vs interest. */
  protected readonly compositionChart = computed<ChartConfiguration>(() => {
    const s = this.summary();
    const c = this.chartColors();
    return {
      type: 'doughnut',
      data: {
        labels: ['Invested capital', 'Interest earned'],
        datasets: [
          {
            data: [s?.totalContributions ?? 0, s?.totalInterest ?? 0],
            backgroundColor: [c.contributions, c.interest],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: '64%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: c.text, usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: ${this.formatCurrency(Number(ctx.parsed))}`,
            },
          },
        },
      },
    };
  });

  // ---- CSV export ----------------------------------------------------------

  protected exportCsv(): void {
    const rows = this.rows();
    if (!rows.length) {
      return;
    }
    const header = [
      'Year',
      'Annual contribution',
      'Interest (year)',
      'Value end of year',
      'Total contributions',
      'Total interest',
      'Real value',
    ];
    const lines = rows.map((r) =>
      [
        r.year,
        r.annualContribution.toFixed(2),
        r.interest.toFixed(2),
        r.valueEndOfYear.toFixed(2),
        r.totalContributions.toFixed(2),
        r.totalInterest.toFixed(2),
        r.realValue.toFixed(2),
      ].join(','),
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-projection-${this.currency()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
