/**
 * Base interface for all indicator data
 */
export interface IndicatorData {
  value: number | null;
  timestamp: number;                       // Unix timestamp
  status: 'normal' | 'warning' | 'danger' | 'good' | 'error';
  error?: string;                          // Optional error message
}

/**
 * Put-Call Ratio specific data interface
 */
export interface PutCallRatioData extends IndicatorData {
  equityPutCallRatio: number | null;       // Equity-only put-call ratio
  indexPutCallRatio: number | null;        // Index-only put-call ratio
  totalPutCallRatio: number | null;        // Combined put-call ratio
  twentyDayAverage: number | null;         // 20-day moving average
  historical?: Array<{                    
    date: number;                          // Unix timestamp
    putCallRatio: number;                  // Historical put-call ratio value
  }>;
  isApproximateData?: boolean;             // Flag for estimated data
  source?: string;                         // Data source description
  lastUpdated?: string;                    // ISO date of last update
} 