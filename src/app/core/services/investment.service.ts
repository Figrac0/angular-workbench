import { Injectable, computed, signal } from '@angular/core';

import {
  COMPOUNDING_PERIODS,
  DEFAULT_INVESTMENT_INPUT,
  InvestmentInput,
  InvestmentProjection,
  InvestmentResultRow,
  InvestmentSummary,
} from '../models/investment.model';

/**
 * Pure compound-interest engine plus reactive state.
 *
 * The projection supports intra-year compounding (monthly/quarterly/…),
 * a yearly growth factor on contributions, and an inflation adjustment that
 * yields the "real" (today's-money) value alongside the nominal figures.
 */
@Injectable({ providedIn: 'root' })
export class InvestmentService {
  /** The most recent input that produced a projection (null before first run). */
  private readonly _lastInput = signal<InvestmentInput | null>(null);
  readonly lastInput = this._lastInput.asReadonly();

  /** The current projection, or null until the user calculates. */
  private readonly _projection = signal<InvestmentProjection | null>(null);
  readonly projection = this._projection.asReadonly();

  readonly rows = computed<InvestmentResultRow[]>(
    () => this._projection()?.rows ?? [],
  );
  readonly summary = computed<InvestmentSummary | null>(
    () => this._projection()?.summary ?? null,
  );
  readonly hasResults = computed(() => this._projection() !== null);

  /** Run a projection and store it as reactive state. */
  calculate(input: InvestmentInput): InvestmentProjection {
    const projection = InvestmentService.project(input);
    this._lastInput.set({ ...input });
    this._projection.set(projection);
    return projection;
  }

  reset(): void {
    this._projection.set(null);
    this._lastInput.set(null);
  }

  /**
   * Pure, side-effect-free projection. Exposed statically so it can be unit
   * tested and reused (e.g. for currency conversions) without touching state.
   */
  static project(input: InvestmentInput): InvestmentProjection {
    const {
      initialInvestment,
      annualInvestment,
      annualInvestmentGrowth,
      expectedReturn,
      duration,
      inflationRate,
      compounding,
      currency,
    } = input;

    const periodsPerYear = COMPOUNDING_PERIODS[compounding];
    const periodRate = expectedReturn / 100 / periodsPerYear;
    const growthFactor = 1 + annualInvestmentGrowth / 100;

    const rows: InvestmentResultRow[] = [];
    let value = initialInvestment;
    let totalContributions = initialInvestment;
    let contributionThisYear = annualInvestment;

    for (let year = 1; year <= duration; year++) {
      const contributionPerPeriod = contributionThisYear / periodsPerYear;
      let interestThisYear = 0;

      for (let period = 0; period < periodsPerYear; period++) {
        const interest = value * periodRate;
        interestThisYear += interest;
        value += interest + contributionPerPeriod;
      }

      totalContributions += contributionThisYear;
      const totalInterest = value - totalContributions;
      const inflationDivisor = Math.pow(1 + inflationRate / 100, year);

      rows.push({
        year,
        interest: interestThisYear,
        valueEndOfYear: value,
        annualContribution: contributionThisYear,
        totalContributions,
        totalInterest,
        realValue: value / inflationDivisor,
      });

      contributionThisYear *= growthFactor;
    }

    const last = rows[rows.length - 1];
    const finalValue = last?.valueEndOfYear ?? initialInvestment;
    const finalContributions = last?.totalContributions ?? initialInvestment;
    const finalInterest = last?.totalInterest ?? 0;
    const realFinalValue = last?.realValue ?? initialInvestment;

    const roi =
      finalContributions > 0 ? (finalInterest / finalContributions) * 100 : 0;
    const cagr =
      initialInvestment > 0 && duration > 0
        ? (Math.pow(finalValue / initialInvestment, 1 / duration) - 1) * 100
        : 0;

    const summary: InvestmentSummary = {
      finalValue,
      totalContributions: finalContributions,
      totalInterest: finalInterest,
      realFinalValue,
      roi,
      cagr,
      currency,
      duration,
    };

    return { rows, summary };
  }

  /** Default values used to seed the form. */
  get defaults(): InvestmentInput {
    return { ...DEFAULT_INVESTMENT_INPUT };
  }
}
