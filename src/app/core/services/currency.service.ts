import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';

import {
  ConversionResult,
  CurrencyMap,
  ExchangeRatesResponse,
  RatePoint,
  TimeSeriesResponse,
} from '../models/currency.model';

/**
 * Live foreign-exchange data from the Frankfurter API — a free, key-less,
 * CORS-enabled service backed by European Central Bank reference rates.
 */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.frankfurter.dev/v1';

  /** Cached list of supported currencies (the list rarely changes). */
  private currencies$?: Observable<CurrencyMap>;

  /** Globally shared "display currency" used across the app. */
  readonly displayCurrency = signal<string>('USD');

  /** ISO code -> currency name. Cached for the session. */
  getCurrencies(): Observable<CurrencyMap> {
    if (!this.currencies$) {
      this.currencies$ = this.http
        .get<CurrencyMap>(`${this.baseUrl}/currencies`)
        .pipe(shareReplay(1));
    }
    return this.currencies$;
  }

  /** Latest rates for a base currency, optionally restricted to `symbols`. */
  getLatestRates(base = 'USD', symbols?: string[]): Observable<ExchangeRatesResponse> {
    let url = `${this.baseUrl}/latest?from=${base}`;
    if (symbols?.length) {
      url += `&to=${symbols.join(',')}`;
    }
    return this.http.get<ExchangeRatesResponse>(url);
  }

  /** Convert a single amount between two currencies using the latest rate. */
  convert(amount: number, from: string, to: string): Observable<ConversionResult> {
    if (from === to) {
      return of({
        from,
        to,
        amount,
        result: amount,
        rate: 1,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    return this.http
      .get<ExchangeRatesResponse>(
        `${this.baseUrl}/latest?amount=${amount}&from=${from}&to=${to}`,
      )
      .pipe(
        map((res) => ({
          from,
          to,
          amount,
          result: res.rates[to],
          rate: res.rates[to] / amount,
          date: res.date,
        })),
      );
  }

  /**
   * Convert a fixed amount into several target currencies at once.
   * Returns a map of code -> converted value.
   */
  convertToMany(
    amount: number,
    from: string,
    targets: string[],
  ): Observable<Record<string, number>> {
    const symbols = targets.filter((t) => t !== from);
    if (!symbols.length) {
      return of({ [from]: amount });
    }
    return this.http
      .get<ExchangeRatesResponse>(
        `${this.baseUrl}/latest?amount=${amount}&from=${from}&to=${symbols.join(',')}`,
      )
      .pipe(
        map((res) => ({ ...res.rates, [from]: amount })),
      );
  }

  /** Historical daily series between two currencies, normalised for charting. */
  getTimeSeries(
    from: string,
    to: string,
    days = 90,
  ): Observable<RatePoint[]> {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    return this.http
      .get<TimeSeriesResponse>(
        `${this.baseUrl}/${fmt(start)}..${fmt(end)}?from=${from}&to=${to}`,
      )
      .pipe(
        map((res) =>
          Object.entries(res.rates)
            .map(([date, rates]) => ({ date, rate: rates[to] }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        ),
      );
  }

  setDisplayCurrency(code: string): void {
    this.displayCurrency.set(code);
  }
}
