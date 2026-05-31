/**
 * Domain models for the investment projection engine.
 * All monetary values are expressed in the user-selected base currency.
 */

export type CompoundingFrequency =
  | 'annually'
  | 'semiannually'
  | 'quarterly'
  | 'monthly';

/** Raw, validated form values that drive a projection. */
export interface InvestmentInput {
  /** Lump sum invested at year zero. */
  initialInvestment: number;
  /** Amount contributed during the first year. */
  annualInvestment: number;
  /** Yearly percentage increase applied to the contribution (e.g. salary growth). */
  annualInvestmentGrowth: number;
  /** Expected nominal annual return, in percent. */
  expectedReturn: number;
  /** Investment horizon, in whole years. */
  duration: number;
  /** Expected average inflation, used to derive the real (today's money) value. */
  inflationRate: number;
  /** How often interest is compounded inside each year. */
  compounding: CompoundingFrequency;
  /** ISO 4217 code the figures are denominated in (e.g. "USD"). */
  currency: string;
}

/** A single projected year in the growth schedule. */
export interface InvestmentResultRow {
  year: number;
  /** Interest earned during this year only. */
  interest: number;
  /** Portfolio value at the end of the year. */
  valueEndOfYear: number;
  /** Contribution made during this year. */
  annualContribution: number;
  /** Cumulative capital paid in (initial + all contributions so far). */
  totalContributions: number;
  /** Cumulative interest earned to date. */
  totalInterest: number;
  /** End-of-year value expressed in today's money (inflation-adjusted). */
  realValue: number;
}

/** Headline figures derived from a full projection. */
export interface InvestmentSummary {
  finalValue: number;
  totalContributions: number;
  totalInterest: number;
  /** Inflation-adjusted final value. */
  realFinalValue: number;
  /** Return on invested capital, in percent. */
  roi: number;
  /** Compound annual growth rate of the whole portfolio, in percent. */
  cagr: number;
  currency: string;
  duration: number;
}

export interface InvestmentProjection {
  rows: InvestmentResultRow[];
  summary: InvestmentSummary;
}

export const COMPOUNDING_PERIODS: Record<CompoundingFrequency, number> = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
};

export const DEFAULT_INVESTMENT_INPUT: InvestmentInput = {
  initialInvestment: 10000,
  annualInvestment: 6000,
  annualInvestmentGrowth: 3,
  expectedReturn: 8,
  duration: 25,
  inflationRate: 2.5,
  compounding: 'monthly',
  currency: 'USD',
};
