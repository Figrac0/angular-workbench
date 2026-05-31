import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  CoinMarket,
  MarketChartResponse,
  PricePoint,
} from '../models/crypto.model';

/**
 * Live cryptocurrency market data from the CoinGecko public API
 * (free, key-less, CORS-enabled). Prices can be quoted in any supported fiat.
 */
@Injectable({ providedIn: 'root' })
export class CryptoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  /**
   * Top coins by market capitalisation, including a 7-day sparkline and
   * multi-window percentage changes for the markets table.
   */
  getMarkets(vsCurrency = 'usd', perPage = 25, page = 1): Observable<CoinMarket[]> {
    const params = new HttpParams({
      fromObject: {
        vs_currency: vsCurrency.toLowerCase(),
        order: 'market_cap_desc',
        per_page: perPage,
        page,
        sparkline: true,
        price_change_percentage: '1h,24h,7d',
      },
    });
    return this.http.get<CoinMarket[]>(`${this.baseUrl}/coins/markets`, { params });
  }

  /** Market data for a specific set of coin ids (used for watchlists). */
  getMarketsByIds(ids: string[], vsCurrency = 'usd'): Observable<CoinMarket[]> {
    const params = new HttpParams({
      fromObject: {
        vs_currency: vsCurrency.toLowerCase(),
        ids: ids.join(','),
        sparkline: true,
        price_change_percentage: '1h,24h,7d',
      },
    });
    return this.http.get<CoinMarket[]>(`${this.baseUrl}/coins/markets`, { params });
  }

  /** Historical price series for a coin, normalised into chart points. */
  getMarketChart(
    id: string,
    days: number,
    vsCurrency = 'usd',
  ): Observable<PricePoint[]> {
    const params = new HttpParams({
      fromObject: {
        vs_currency: vsCurrency.toLowerCase(),
        days,
      },
    });
    return this.http
      .get<MarketChartResponse>(`${this.baseUrl}/coins/${id}/market_chart`, {
        params,
      })
      .pipe(
        map((res) =>
          res.prices.map(([timestamp, price]) => ({ timestamp, price })),
        ),
      );
  }
}
