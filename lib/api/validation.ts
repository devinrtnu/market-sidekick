import { MarketDataResponse } from './types';

/**
 * Validates market data for format and reasonable values
 * Returns true if data is valid, false otherwise
 */
export function validateMarketData(data: MarketDataResponse): boolean {
  // Type validation
  if (typeof data.value !== 'number' || isNaN(data.value)) {
    console.error('Invalid value type:', data.value);
    return false;
  }
  
  if (typeof data.change !== 'number' || isNaN(data.change)) {
    console.error('Invalid change type:', data.change);
    return false;
  }
  
  // Value range validation based on symbol
  switch (data.symbol) {
    case '^GSPC': // S&P 500
      if (data.value < 0 || data.value > 10000) {
        console.error('S&P 500 value out of reasonable range:', data.value);
        return false;
      }
      break;
      
    case '^TNX': // 10Y Treasury
      if (data.value < 0 || data.value > 25) {
        console.error('10Y Treasury yield out of reasonable range:', data.value);
        return false;
      }
      break;
      
    case 'GC=F': // Gold
      if (data.value < 500 || data.value > 5000) {
        console.error('Gold price out of reasonable range:', data.value);
        return false;
      }
      break;
      
    case '^VIX': // VIX
      if (data.value < 5 || data.value > 100) {
        console.error('VIX value out of reasonable range:', data.value);
        return false;
      }
      break;
  }
  
  // Change percentage validation (prevent unrealistic changes)
  if (Math.abs(data.change) > 20) {
    console.error('Change percentage too extreme:', data.change);
    return false;
  }
  
  // Timestamp validation (ensure data is not too old)
  const now = new Date();
  const dataTime = data.timestamp;
  const hoursDiff = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60);
  
  // Market data shouldn't be more than 24 hours old on weekdays
  // On weekends, we allow older data since markets are closed
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const maxHours = isWeekend ? 72 : 24;
  
  if (hoursDiff > maxHours) {
    console.error('Data too old:', dataTime, 'hours diff:', hoursDiff);
    return false;
  }
  
  return true;
}

/**
 * Validates sparkline data points
 * Returns true if data is valid, false otherwise
 */
export function validateSparklineData(
  symbol: string, 
  data: { date: string; value: number }[]
): boolean {
  // Must have at least 2 points for a sparkline
  if (!Array.isArray(data) || data.length < 2) {
    console.error('Insufficient sparkline data points for', symbol);
    return false;
  }

  // Validate each data point
  for (const point of data) {
    if (typeof point.date !== 'string' || point.date.trim() === '') {
      console.error('Invalid date in sparkline data for', symbol);
      return false;
    }

    if (typeof point.value !== 'number' || isNaN(point.value)) {
      console.error('Invalid value in sparkline data for', symbol);
      return false;
    }

    // Check value ranges based on symbol
    switch (symbol) {
      case '^GSPC': // S&P 500
        if (point.value < 0 || point.value > 10000) {
          console.error('S&P 500 sparkline value out of range:', point.value);
          return false;
        }
        break;

      case '^TNX': // 10Y Treasury
        if (point.value < 0 || point.value > 25) {
          console.error('10Y Treasury sparkline value out of range:', point.value);
          return false;
        }
        break;

      case 'GC=F': // Gold
        if (point.value < 500 || point.value > 5000) {
          console.error('Gold sparkline value out of range:', point.value);
          return false;
        }
        break;

      case '^VIX': // VIX
        if (point.value < 5 || point.value > 100) {
          console.error('VIX sparkline value out of range:', point.value);
          return false;
        }
        break;

      case 'T10Y2Y': // Yield Curve Spread
        if (point.value < -5 || point.value > 5) {
          console.error('Yield curve spread out of range:', point.value);
          return false;
        }
        break;
    }
  }

  // Make sure dates are in sequence
  const dates = data.map(point => new Date(point.date).getTime());
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] <= dates[i-1]) {
      console.error('Sparkline dates not in sequence for', symbol);
      return false;
    }
  }

  return true;
}

/**
 * Validates yield curve data
 */
export function validateYieldCurveData(data: any): boolean {
  if (!data) {
    console.error('Yield curve data is null or undefined');
    return false;
  }

  // Validate title and value
  if (typeof data.title !== 'string' || data.title.trim() === '') {
    console.error('Invalid or missing yield curve title');
    return false;
  }

  if (typeof data.value !== 'string' || data.value.trim() === '') {
    console.error('Invalid or missing yield curve value string');
    return false;
  }

  // Validate change
  if (typeof data.change !== 'number' || isNaN(data.change)) {
    console.error('Invalid yield curve change:', data.change);
    return false;
  }

  // Validate status
  const validStatuses = ['normal', 'warning', 'danger', 'error'];
  if (!data.status || !validStatuses.includes(data.status)) {
    console.error('Invalid yield curve status:', data.status);
    return false;
  }

  // Validate numerical values
  if (typeof data.spread !== 'number' || isNaN(data.spread)) {
    console.error('Invalid yield curve spread:', data.spread);
    return false;
  }

  // Validate reasonable spread range (-5% to 5%)
  if (data.spread < -0.05 || data.spread > 0.05) {
    console.error('Yield curve spread out of reasonable range:', data.spread);
    return false;
  }

  // Validate yields
  if (typeof data.tenYearYield !== 'number' || isNaN(data.tenYearYield)) {
    console.error('Invalid 10-year yield:', data.tenYearYield);
    return false;
  }

  if (typeof data.twoYearYield !== 'number' || isNaN(data.twoYearYield)) {
    console.error('Invalid 2-year yield:', data.twoYearYield);
    return false;
  }

  // Validate reasonable yield ranges (0% to 25%)
  if (data.tenYearYield < 0 || data.tenYearYield > 0.25) {
    console.error('10-year yield out of reasonable range:', data.tenYearYield);
    return false;
  }

  if (data.twoYearYield < 0 || data.twoYearYield > 0.25) {
    console.error('2-year yield out of reasonable range:', data.twoYearYield);
    return false;
  }

  // Validate sparkline data
  if (!Array.isArray(data.sparklineData) || data.sparklineData.length < 2) {
    console.error('Invalid or insufficient yield curve sparkline data');
    return false;
  }

  // Validate each sparkline data point
  for (const point of data.sparklineData) {
    if (typeof point.date !== 'string' || point.date.trim() === '') {
      console.error('Invalid date in yield curve sparkline data');
      return false;
    }

    if (typeof point.value !== 'number' || isNaN(point.value)) {
      console.error('Invalid value in yield curve sparkline data');
      return false;
    }

    // Check value ranges for spread
    if (point.value < -0.05 || point.value > 0.05) {
      console.error('Yield curve sparkline value out of range:', point.value);
      return false;
    }
  }

  // Validate lastUpdated and latestDataDate if present
  if (data.lastUpdated && !(new Date(data.lastUpdated).getTime() > 0)) {
    console.error('Invalid lastUpdated date:', data.lastUpdated);
    return false;
  }

  if (data.latestDataDate && !(new Date(data.latestDataDate).getTime() > 0)) {
    console.error('Invalid latestDataDate:', data.latestDataDate);
    return false;
  }

  // Validate lastInversion if present
  if (data.lastInversion) {
    if (typeof data.lastInversion !== 'object') {
      console.error('Invalid lastInversion object');
      return false;
    }

    if (typeof data.lastInversion.date !== 'string' || !(new Date(data.lastInversion.date).getTime() > 0)) {
      console.error('Invalid lastInversion date:', data.lastInversion.date);
      return false;
    }

    if (typeof data.lastInversion.duration !== 'string' || data.lastInversion.duration.trim() === '') {
      console.error('Invalid lastInversion duration:', data.lastInversion.duration);
      return false;
    }

    if (typeof data.lastInversion.followedByRecession !== 'boolean') {
      console.error('Invalid lastInversion followedByRecession flag');
      return false;
    }

    // Only validate recessionStart if followedByRecession is true
    if (data.lastInversion.followedByRecession && 
        data.lastInversion.recessionStart && 
        !(new Date(data.lastInversion.recessionStart).getTime() > 0)) {
      console.error('Invalid lastInversion recessionStart date:', data.lastInversion.recessionStart);
      return false;
    }
  }

  return true;
}
