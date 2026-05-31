/** Models for the Frankfurter foreign-exchange API (https://www.frankfurter.app). */

/** Map of ISO 4217 code -> human readable currency name. */
export type CurrencyMap = Record<string, string>;

export interface ExchangeRatesResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface TimeSeriesResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  /** Keyed by ISO date -> { TARGET: rate }. */
  rates: Record<string, Record<string, number>>;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  date: string;
}

/** A normalised point for plotting an FX time series. */
export interface RatePoint {
  date: string;
  rate: number;
}

/** Currencies surfaced as quick-pick chips in the UI. */
export const POPULAR_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'CNY',
];

/** Symbols for nicer display where Intl is not used directly. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'Fr',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  RUB: '₽',
};
