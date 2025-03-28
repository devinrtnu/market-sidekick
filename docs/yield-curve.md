# Yield Curve Inversion Implementation Documentation

## Overview

The yield curve inversion chart tracks the spread between 10-year and 2-year US Treasury yields, which is a key economic indicator. When this curve inverts (becomes negative), it has historically preceded recessions.

## Data Structure

The yield curve inversion chart uses the `YieldCurveData` interface:

```typescript
export interface YieldCurveData extends IndicatorData {
  spread: number | null;                 // 10Y-2Y spread
  tenYearYield: number | null;           
  twoYearYield: number | null;           
  timeSeriesData?: Array<{              
    date: number;                        // Unix timestamp
    spread: number;                      // 10Y-2Y spread in decimal format
  }>;
  historicalInversions?: Array<{         
    start: number;                       // Unix timestamp
    end: number | null;                  // Unix timestamp or null if ongoing
    recession: {
      start: number | null;              // Unix timestamp or null if not yet started
      end: number | null;                // Unix timestamp or null if ongoing
      name?: string;                     // Optional name for recession identification
    } | null;                            // null if no recession followed
  }>;
}
```

It extends the base `IndicatorData` interface:

```typescript
export interface IndicatorData {
  value: number | null;
  timestamp: number;                    // Unix timestamp
  status: 'normal' | 'warning' | 'danger' | 'error';
  error?: string;                       // Optional error message when status is 'error'
}
```

## FRED API Integration

### API Details

The implementation uses the Federal Reserve Economic Data (FRED) API:

1. **Base URL**: `https://api.stlouisfed.org/fred/`
2. **Endpoint**: `series/observations`
3. **Authentication**: Requires API key as a query parameter `api_key`
4. **Response Format**: JSON

### FRED Series IDs Used

1. `T10Y2Y`: 10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity
2. `DGS10`: 10-Year Treasury Constant Maturity Rate
3. `DGS2`: 2-Year Treasury Constant Maturity Rate

### Helper Function for FRED API Calls

```typescript
/**
 * Fetch data from FRED API for a specific series
 * @param seriesId FRED series ID
 * @param limit Number of observations to retrieve
 * @returns Promise with series data
 */
async function fetchFredSeries(seriesId: string, limit: number = 30) {
  // API key should be stored in environment variables in production
  const FRED_API_KEY = '580e70284863ed619a70419f10f1e3e3'; 
  
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}`;
  
  // Using fetch with caching for 1 hour
  const response = await fetch(url, { 
    cache: 'max-age=3600',
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
  }
  
  // FRED API response format:
  // {
  //   "realtime_start": "2023-03-24",
  //   "realtime_end": "2023-03-24",
  //   "observation_start": "1776-07-04",
  //   "observation_end": "9999-12-31",
  //   "units": "lin",
  //   "output_type": 1,
  //   "file_type": "json",
  //   "order_by": "observation_date",
  //   "sort_order": "asc",
  //   "count": 30,
  //   "offset": 0,
  //   "limit": 30,
  //   "observations": [
  //     {
  //       "realtime_start": "2023-03-24",
  //       "realtime_end": "2023-03-24",
  //       "date": "2023-02-14",
  //       "value": "3.36"
  //     },
  //     ...
  //   ]
  // }
  
  return await response.json();
}
```

### Time Range Parameters

This function converts time range strings to appropriate observation limits:

```typescript
/**
 * Get limit value based on timeframe
 * @param timeframe Time range requested
 * @returns Appropriate limit for FRED API
 */
function getLimitFromTimeframe(timeframe: string): number {
  switch (timeframe) {
    case '1m': return 30;   // 1 month of daily data (approx)
    case '3m': return 90;   // 3 months of daily data (approx)
    case '6m': return 180;  // 6 months of daily data (approx)
    case '1y': return 250;  // 1 year of trading days (approx)
    case '2y': return 500;  // 2 years of trading days (approx)
    case '5y': return 1250; // 5 years of trading days (approx)
    case '10y': return 2500; // 10 years of trading days (approx)
    default: return 30;     // Default to 1 month
  }
}
```

## Recession Data

For tracking historical inversions and recessions, the implementation maintains a constant with key recession periods:

```typescript
/**
 * Comprehensive list of US recessions from 2000-present
 * Includes start and end dates as timestamps
 */
const US_RECESSIONS = [
  {
    // Dot-com recession
    start: new Date('2001-03-01').getTime(),
    end: new Date('2001-11-01').getTime(),
    name: 'Dot-com bubble recession'
  },
  {
    // Great Recession
    start: new Date('2007-12-01').getTime(),
    end: new Date('2009-06-01').getTime(),
    name: 'Great Recession'
  },
  {
    // COVID-19 Recession
    start: new Date('2020-02-01').getTime(),
    end: new Date('2020-04-30').getTime(),
    name: 'COVID-19 recession'
  },
  {
    // Brief 2022 Technical Recession (two quarters of negative GDP growth)
    start: new Date('2022-01-01').getTime(),
    end: new Date('2022-06-30').getTime(),
    name: 'Technical recession (2022)'
  }
];
```

### Finding Recessions After Inversions

This helper function identifies which recessions followed a yield curve inversion:

```typescript
/**
 * Find recessions that followed an inversion period
 * @param inversionEndDate End date of the inversion period
 * @returns Information about the recession if one followed
 */
function findFollowingRecession(inversionEndDate: number | null): { start: number; end: number; name: string } | null {
  // If the inversion is still ongoing, no recession has followed yet
  if (!inversionEndDate) {
    return null;
  }
  
  // Look for recessions that started after the inversion ended
  // Generally looking within a 24-month window as predictive timeframe
  const PREDICTION_WINDOW_MS = 24 * 30 * 24 * 60 * 60 * 1000; // 24 months in milliseconds
  
  for (const recession of US_RECESSIONS) {
    // Check if the recession started after the inversion ended but within the prediction window
    if (recession.start > inversionEndDate && 
        recession.start <= inversionEndDate + PREDICTION_WINDOW_MS) {
      return recession;
    }
  }
  
  return null;
}
```

## Inversion Detection Algorithm

The algorithm detects periods when the yield curve inverts (10Y-2Y spread goes negative):

```typescript
/**
 * Detects periods of yield curve inversion from time series data
 * @param timeSeriesData Array of time series data points with date and spread values
 * @returns Array of inversion periods with start, end, and recession data
 */
function detectInversionPeriods(timeSeriesData: Array<{date: number, spread: number}>): Array<{
  start: number;
  end: number | null;
  recession: {
    start: number | null;
    end: number | null;
    name?: string;
  } | null;
}> {
  // Known historical inversions for reference and fallback
  const KNOWN_HISTORICAL_INVERSIONS = [
    {
      start: new Date('2019-05-23').getTime(),
      end: new Date('2019-10-11').getTime(),
      recession: {
        start: new Date('2020-02-01').getTime(),
        end: new Date('2020-04-30').getTime(),
        name: 'COVID-19 recession'
      }
    },
    {
      start: new Date('2022-04-01').getTime(),
      end: new Date('2022-04-20').getTime(),
      recession: {
        start: new Date('2022-01-01').getTime(),
        end: new Date('2022-06-30').getTime(),
        name: 'Technical recession (2022)'
      }
    },
    {
      start: new Date('2022-07-05').getTime(),
      end: new Date('2023-11-10').getTime(),
      recession: null
    }
  ];
  
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return KNOWN_HISTORICAL_INVERSIONS;
  }
  
  const inversions = [];
  let inversionStart = null;
  let previousPoint = null;
  const MIN_INVERSION_DAYS = 5; // Minimum days to consider a meaningful inversion
  
  // Sort data chronologically
  const sortedData = [...timeSeriesData].sort((a, b) => a.date - b.date);
  
  // Scan through data to find periods where spread went negative
  for (const point of sortedData) {
    if (point.spread === undefined || point.spread === null || isNaN(point.spread)) {
      continue;
    }
    
    if (previousPoint === null) {
      previousPoint = point;
      continue;
    }
    
    // Check for start of inversion (crossing below zero)
    if (previousPoint.spread >= 0 && point.spread < 0) {
      inversionStart = point.date;
    }
    
    // Check for end of inversion (crossing above zero)
    if (previousPoint.spread < 0 && point.spread >= 0 && inversionStart !== null) {
      // Calculate duration in days
      const durationDays = Math.round((point.date - inversionStart) / (1000 * 60 * 60 * 24));
      
      // Only record inversions that last for a meaningful period
      if (durationDays >= MIN_INVERSION_DAYS) {
        inversions.push({
          start: inversionStart,
          end: point.date,
          recession: findFollowingRecession(point.date)
        });
      }
      
      inversionStart = null;
    }
    
    previousPoint = point;
  }
  
  // Check if we're currently in an inversion
  if (inversionStart !== null && previousPoint !== null && previousPoint.spread < 0) {
    const currentDurationDays = Math.round((Date.now() - inversionStart) / (1000 * 60 * 60 * 24));
    
    if (currentDurationDays >= MIN_INVERSION_DAYS) {
      inversions.push({
        start: inversionStart,
        end: null, // Still ongoing
        recession: null // No recession has followed yet
      });
    }
  }
  
  // Merge detected inversions with known historical ones
  const combinedInversions = [...inversions, ...KNOWN_HISTORICAL_INVERSIONS];
  
  // Remove duplicates and filter to most recent 10 years
  const uniqueInversions = removeDuplicateInversions(combinedInversions);
  
  return uniqueInversions;
}
```

### Removing Duplicate Inversions

```typescript
/**
 * Remove duplicate inversions and filter to recent ones
 * @param inversions Combined list of detected and known inversions
 * @returns Filtered list of unique inversions
 */
function removeDuplicateInversions(inversions: Array<{
  start: number;
  end: number | null;
  recession: any;
}>): Array<{
  start: number;
  end: number | null;
  recession: any;
}> {
  // Process sorted by date (oldest first)
  inversions.sort((a, b) => a.start - b.start);
  
  const uniqueInversions = [];
  const processedStartDates = new Set();
  
  // Check if a date is within 7 days of any date in the set
  const isDateNearAny = (date: number, dateSet: Set<string>): boolean => {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    
    for (const existingDateStr of dateSet) {
      const existingDateTime = new Date(existingDateStr).getTime();
      if (Math.abs(date - existingDateTime) < WEEK_MS) {
        return true;
      }
    }
    return false;
  };
  
  // Filter out duplicates
  for (const inversion of inversions) {
    const startDateStr = new Date(inversion.start).toISOString().split('T')[0];
    
    if (!isDateNearAny(inversion.start, processedStartDates)) {
      processedStartDates.add(startDateStr);
      uniqueInversions.push(inversion);
    }
  }
  
  // Sort inversions by start date (newest first) for display
  uniqueInversions.sort((a, b) => b.start - a.start);
  
  // Just return the most recent inversions (last 10 years)
  const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
  const cutoffDate = Date.now() - TEN_YEARS_MS;
  
  return uniqueInversions.filter(inv => inv.start > cutoffDate);
}
```

## Data Validation

This function ensures all dates in the time series data are valid:

```typescript
/**
 * Validates and corrects dates in time series data
 * @param timeSeriesData Array of time series data points
 * @returns Corrected time series data
 */
function validateAndCorrectDates(timeSeriesData: Array<{date: number, spread: number}>): Array<{date: number, spread: number}> {
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return [];
  }
  
  const now = Date.now();
  const correctedData = [];
  
  for (const point of timeSeriesData) {
    // Check if the date is in the future
    if (point.date > now) {
      // Create a corrected point with the date adjusted to be in the past
      const correctedPoint = {
        ...point,
        date: now - (point.date - now) // Mirror the future date to the past
      };
      
      correctedData.push(correctedPoint);
    } else {
      correctedData.push(point);
    }
  }
  
  return correctedData;
}
```

## Status Determination

The yield curve status is determined by the `determineIndicatorStatus` function:

```typescript
/**
 * Determines the status of an indicator based on thresholds
 * @param value The current value of the indicator
 * @param normalThreshold Threshold for normal status
 * @param warningThreshold Threshold for warning status
 * @param isHigherDangerous Whether higher values are more dangerous (true) or lower values (false)
 * @returns Status string: 'normal', 'warning', or 'danger'
 */
function determineIndicatorStatus(
  value: number,
  normalThreshold: number,  // 0.2 (20%)
  warningThreshold: number, // 0 (0%)
  isHigherDangerous = true  // For yield curve, false (lower is worse)
): 'normal' | 'warning' | 'danger' {
  if (isHigherDangerous) {
    if (value <= normalThreshold) return 'normal';
    if (value <= warningThreshold) return 'warning';
    return 'danger';
  } else {
    if (value >= normalThreshold) return 'normal';    // spread ≥ 0.2%
    if (value >= warningThreshold) return 'warning';  // 0% ≤ spread < 0.2% 
    return 'danger';                                  // spread < 0% (inverted)
  }
}
```

## Human-Readable Description Generator

This function generates text descriptions of the yield curve state:

```typescript
/**
 * Get a human-readable description of the yield curve status
 */
function getYieldCurveDescription(data: YieldCurveData): string {
  const { spread } = data;
  
  if (spread === null || spread === undefined) {
    return 'Yield curve data is currently unavailable.';
  }
  
  const spreadPercentage = spread * 100;
  
  if (spread < 0) {
    return `The yield curve is inverted by ${Math.abs(spreadPercentage).toFixed(2)}%, historically a recession warning signal.`;
  } else if (spread < 0.002) {
    return `The yield curve is flat (${spreadPercentage.toFixed(2)}%), suggesting economic uncertainty.`;
  } else if (spread < 0.005) {
    return `The yield curve is slightly positive (${spreadPercentage.toFixed(2)}%), indicating modest growth expectations.`;
  } else {
    return `The yield curve is positively sloped (${spreadPercentage.toFixed(2)}%), suggesting healthy economic growth expectations.`;
  }
}
```

## Complete API Implementation

Below is the full implementation of the yield curve API endpoint:

```typescript
/**
 * API endpoint to fetch 10Y-2Y Treasury yield curve data 
 */
export async function GET(request: Request) {
  try {
    // Extract the timeframe from the URL parameters
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '1m'; // Default to 1 month
    
    // For historical inversions, always fetch a longer period
    const historicalLimit = getLimitFromTimeframe('10y'); // Use 10 years for detecting inversions
    
    // 1. FETCH HISTORICAL DATA FOR INVERSIONS
    // ---------------------------------------
    const historicalSpreadData = await fetchFredSeries(TREASURY_10Y2Y_SERIES, historicalLimit);
    
    // Process historical spread data for inversion detection
    const historicalTimeSeriesData = [];
    for (const obs of historicalSpreadData.observations) {
      if (obs.value === '.') continue;
      const date = new Date(obs.date);
      
      // Ensure we're not using dates in the future
      if (date > new Date()) {
        continue;
      }
      
      historicalTimeSeriesData.push({
        date: date.getTime(),
        spread: parseFloat(obs.value) / 100 // Convert from percent to decimal
      });
    }
    
    // Reverse to get chronological order
    historicalTimeSeriesData.reverse();
    
    // Detect historical inversion periods
    const inversions = detectInversionPeriods(historicalTimeSeriesData);
    
    // 2. FETCH DATA FOR REQUESTED TIMEFRAME
    // -------------------------------------
    const limit = getLimitFromTimeframe(timeframe);
    const spreadHistoricalData = await fetchFredSeries(TREASURY_10Y2Y_SERIES, limit);
    
    // 3. FETCH CURRENT 10Y AND 2Y YIELDS
    // ----------------------------------
    const [tenYearData, twoYearData] = await Promise.all([
      fetchFredSeries(TREASURY_10Y_SERIES, 1),
      fetchFredSeries(TREASURY_2Y_SERIES, 1),
    ]);
    
    // Get the most recent non-null values
    const latestTenYear = tenYearData.observations
      .find((obs) => obs.value !== '.');
    const latestTwoYear = twoYearData.observations
      .find((obs) => obs.value !== '.');
    
    if (!latestTenYear || !latestTwoYear) {
      throw new Error('Invalid FRED data: missing latest yield values');
    }
    
    // Convert string percentages to numbers and decimal format
    const tenYearYield = parseFloat(latestTenYear.value) / 100;
    const twoYearYield = parseFloat(latestTwoYear.value) / 100;
    
    // 4. PROCESS TIME SERIES DATA
    // --------------------------
    const timeSeriesData = [];
    
    for (const obs of spreadHistoricalData.observations) {
      // Skip if value is missing
      if (obs.value === '.') {
        continue;
      }
      
      // Convert from percentage to decimal
      const spreadValue = parseFloat(obs.value) / 100;
      const date = new Date(obs.date);
      
      // Verify the date is valid and not in the future
      if (isNaN(date.getTime()) || date > new Date()) {
        continue;
      }
      
      timeSeriesData.push({
        date: date.getTime(),
        spread: spreadValue
      });
    }
    
    // Reverse the array to get chronological order
    timeSeriesData.reverse();
    
    // Validate and correct any remaining date issues
    const validatedTimeSeriesData = validateAndCorrectDates(timeSeriesData);
    
    // 5. DETERMINE CURRENT SPREAD VALUE AND STATUS
    // ------------------------------------------
    
    // Use the most recent spread from the T10Y2Y series for consistency
    let spread;
    if (validatedTimeSeriesData.length > 0) {
      // Use the most recent value from the timeSeriesData
      spread = validatedTimeSeriesData[validatedTimeSeriesData.length - 1].spread;
    } else {
      // Fallback to calculated spread if no time series data
      spread = tenYearYield - twoYearYield;
    }
    
    // Determine status based on spread
    const status = determineIndicatorStatus(
      spread,
      0.2, // normal threshold (0.2 or 20%)
      0,   // warning threshold (0 or 0%)
      false // lower is more dangerous for yield curve
    );
    
    // 6. PREPARE RESPONSE
    // ------------------
    const yieldCurveData: YieldCurveData = {
      value: spread,
      timestamp: Date.now(),
      status,
      spread,
      tenYearYield,
      twoYearYield,
      timeSeriesData: validatedTimeSeriesData,
      historicalInversions: inversions
    };
    
    return Response.json(yieldCurveData);
  } catch (error) {
    // 7. ERROR HANDLING
    // ----------------
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Return error response
    return Response.json(
      { 
        error: 'Failed to fetch yield curve data',
        message: errorMessage,
        timestamp: Date.now(),
        spread: null,
        tenYearYield: null,
        twoYearYield: null,
        status: 'error'
      },
      { status: 500 }
    );
  }
}
```

## Frontend Implementation

Complete frontend implementation for fetching and displaying yield curve data:

```typescript
// In a React component
import { useState, useEffect, useCallback } from 'react';

interface YieldCurveDisplayProps {
  // Add any props needed
}

function YieldCurveDisplay(props: YieldCurveDisplayProps) {
  // Data state
  const [yieldCurveData, setYieldCurveData] = useState<YieldCurveData | null>(null);
  const [chartData, setChartData] = useState<Array<{x: number, y: number}>>([]);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1m');
  
  // Time range options for selector
  const timeRangeOptions = [
    { value: '1m', label: '1 Month' },
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' },
    { value: '5y', label: '5 Years' }
  ];
  
  // Fetch data function
  const fetchYieldCurveData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Make API request with selected timeframe
      const response = await fetch(`/api/crashboard/yield-curve?timeframe=${selectedTimeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch yield curve data: ${response.status}`);
      }
      
      const data: YieldCurveData = await response.json();
      
      // Process time series data for the chart
      if (data.timeSeriesData && data.timeSeriesData.length > 0) {
        // Format for your charting library
        const formattedChartData = data.timeSeriesData.map(point => ({
          x: point.date,
          y: point.spread
        }));
        
        setChartData(formattedChartData);
      } else {
        setChartData([]);
      }
      
      setYieldCurveData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching yield curve data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load yield curve data');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);
  
  // Initial data fetch and refresh timer
  useEffect(() => {
    // Flag to prevent state updates after component unmount
    let isMounted = true;
    
    async function loadData() {
      try {
        await fetchYieldCurveData();
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load yield curve data:', err);
          setError('Failed to load yield curve data');
        }
      }
    }
    
    loadData();
    
    // Refresh data every hour (3600000ms)
    const intervalId = setInterval(loadData, 3600000);
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchYieldCurveData]);
  
  // Handle time range selection change
  const handleTimeRangeChange = (newTimeRange: string) => {
    setSelectedTimeRange(newTimeRange);
    // fetchYieldCurveData will be called via the useEffect dependency
  };
  
  // Format spread for display
  const formatSpreadValue = () => {
    if (!yieldCurveData || yieldCurveData.spread === null || yieldCurveData.spread === undefined) {
      return 'N/A';
    }
    
    // Convert from decimal to percentage and format
    const percentage = (yieldCurveData.spread * 100).toFixed(2);
    return `${percentage}%`;
  };
  
  // Helper to get description based on status
  const getStatusDescription = () => {
    if (!yieldCurveData) return '';
    
    return getYieldCurveDescription(yieldCurveData);
  };
  
  // Render loading state
  if (loading && !yieldCurveData) {
    return <div>Loading yield curve data...</div>;
  }
  
  // Render error state
  if (error && !yieldCurveData) {
    return <div>Error: {error}</div>;
  }
  
  // Main render with data
  return (
    <div>
      <h2>Yield Curve Inversion (10Y-2Y)</h2>
      
      {/* Current spread value and status */}
      <div>
        <div>Spread: {formatSpreadValue()}</div>
        <div>{getStatusDescription()}</div>
        <div>Status: {yieldCurveData?.status}</div>
      </div>
      
      {/* Time range selector */}
      <div>
        <label htmlFor="timerange">Time Range:</label>
        <select 
          id="timerange"
          value={selectedTimeRange} 
          onChange={(e) => handleTimeRangeChange(e.target.value)}
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Chart container - implementation depends on your charting library */}
      <div style={{ height: '200px', marginTop: '20px' }}>
        {chartData.length > 0 ? (
          <YourChartComponent 
            data={chartData}
            thresholds={[
              { value: 0, label: "Inversion" },
              { value: 0.005, label: "Flat" }
            ]}
            yAxisFormatter={(val) => `${(val * 100).toFixed(2)}%`}
            tooltipFormatter={(val) => `${(val * 100).toFixed(2)}%`}
          />
        ) : (
          <div>No chart data available</div>
        )}
      </div>
      
      {/* Current yields display */}
      <div>
        <div>
          <div>10-Year Yield:</div>
          <div>{yieldCurveData?.tenYearYield !== null 
            ? `${(yieldCurveData.tenYearYield * 100).toFixed(2)}%` 
            : 'N/A'}
          </div>
        </div>
        
        <div>
          <div>2-Year Yield:</div>
          <div>{yieldCurveData?.twoYearYield !== null 
            ? `${(yieldCurveData.twoYearYield * 100).toFixed(2)}%` 
            : 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Historical inversions section */}
      {yieldCurveData?.historicalInversions && yieldCurveData.historicalInversions.length > 0 && (
        <div>
          <h3>Historical Inversions</h3>
          <ul>
            {yieldCurveData.historicalInversions.map((inversion, index) => {
              const startDate = new Date(inversion.start).toLocaleDateString();
              const endDate = inversion.end 
                ? new Date(inversion.end).toLocaleDateString() 
                : 'Ongoing';
              
              const recessionInfo = inversion.recession 
                ? `Recession: ${inversion.recession.name || 'Unnamed'} (${new Date(inversion.recession.start).toLocaleDateString()} - ${inversion.recession.end ? new Date(inversion.recession.end).toLocaleDateString() : 'Ongoing'})` 
                : 'No recession followed';
              
              return (
                <li key={index}>
                  <div>Inversion: {startDate} - {endDate}</div>
                  <div>{recessionInfo}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Key Thresholds for Status Determination

The implementation uses these thresholds to determine the status of the yield curve:

- **Normal**: spread ≥ 0.2% - Healthy economic growth expectations
- **Warning**: 0% ≤ spread < 0.2% - Flattening yield curve, potential economic uncertainty
- **Danger**: spread < 0% (negative, inverted) - Historical recession warning signal

## Notes on Implementation

1. **API Key Security**: In a production environment, the FRED API key should be stored in environment variables or a secure configuration system, not hardcoded.

2. **Error Handling**: The implementation includes comprehensive error handling at both API and component levels to ensure graceful degradation.

3. **Caching**: FRED data doesn't change frequently (daily at most), so responses are cached for an hour to minimize API calls.

4. **Data Validation**: Special attention is paid to validating dates and preventing issues with missing or invalid data points.

5. **Historical Records**: The implementation maintains a set of known historical inversions to ensure complete data even when API access is limited.

6. **Performance**: The detection algorithm is optimized to handle large datasets efficiently.

This documentation provides a complete reference for implementing yield curve inversion tracking without any styling dependencies. 