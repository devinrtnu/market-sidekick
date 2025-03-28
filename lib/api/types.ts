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
}

/**
 * Interface for yield curve data from FRED API
 */
export interface YieldCurveData extends TransformedIndicatorData {
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
  lastUpdated?: string;  // ISO timestamp of when data was fetched
  latestDataDate?: string; // The date of the most recent data point
}
