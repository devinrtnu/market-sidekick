/**
 * Interface for the Yahoo Finance API response
 */
export interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
  // Additional fields as needed
}

/**
 * Interface for our internal market data format
 */
export interface MarketDataResponse {
  symbol: string;
  value: number;
  change: number;
  timestamp: Date;
  isStale?: boolean;
}

/**
 * Interface for sparkline data points
 */
export interface SparklineDataPoint {
  date: string;
  value: number;
  isoDate?: string; // ISO date for debugging
}

/**
 * Interface for the transformed indicator data
 * that matches the TopIndicatorProps format
 */
export interface TransformedIndicatorData {
  id?: string;
  title: string;
  value: number | string;
  change: number;
  sparklineData: SparklineDataPoint[];
  status?: 'normal' | 'warning' | 'danger' | 'error';
  tradingSymbol?: string;
}

/**
 * Interface for yield curve data from FRED API
 */
export interface YieldCurveData {
  title: string;
  value: string;
  change: number | null;
  sparklineData: SparklineDataPoint[];
  status: 'normal' | 'warning' | 'danger' | 'good' | 'error';
  spread: number;
  tenYearYield: number;
  twoYearYield: number;
  historicalInversions?: Array<{
    start: number;
    end: number | null;
    recession: {
      start: number | null;
      end: number | null;
      name?: string;
    } | null;
  }>;
  lastInversion?: {
    date: string;
    duration: string;
    followedByRecession: boolean;
    recessionStart?: string;
  };
  lastUpdated?: string;
  latestDataDate?: string;
  error?: string;
  source?: string;
  timeframe?: string;
  cachedAt?: number;
}
