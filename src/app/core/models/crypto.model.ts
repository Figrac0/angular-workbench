/** Models for the CoinGecko public API (https://www.coingecko.com/en/api). */

/** Shape returned by /coins/markets. */
export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  ath: number;
  ath_change_percentage: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
}

/** Shape returned by /coins/{id}/market_chart. */
export interface MarketChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/** A normalised price point for charting. */
export interface PricePoint {
  timestamp: number;
  price: number;
}

/** Supported look-back windows for the detail chart. */
export const CHART_RANGES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
] as const;

export type ChartRange = (typeof CHART_RANGES)[number];
