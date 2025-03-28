import { PutCallRatioData } from '../types/indicators';

/**
 * Determine status based on put-call ratio value
 * @param ratio The current put-call ratio
 * @returns Status as 'normal', 'warning', 'danger', or 'good'
 */
export function determinePutCallStatus(ratio: number): 'normal' | 'warning' | 'danger' | 'good' {
  if (ratio < 0.7) {
    return 'normal';  // Low ratio = bullish sentiment = normal
  } else if (ratio < 1.0) {
    return 'warning'; // Medium ratio = neutral to cautious = warning
  } else {
    return 'danger';  // High ratio = bearish sentiment = danger
  }
}

/**
 * Get a human-readable description of the put/call ratio
 */
export function getPutCallRatioDescription(data: PutCallRatioData): string[] {
  const { totalPutCallRatio, twentyDayAverage } = data;
  
  if (totalPutCallRatio === null) {
    return ['Put/call ratio data is currently unavailable.'];
  }
  
  let descriptions: string[] = [];
  
  descriptions.push(`The current put/call ratio is ${totalPutCallRatio.toFixed(2)}.`);
  
  if (twentyDayAverage !== null) {
    const percentChange = ((totalPutCallRatio - twentyDayAverage) / twentyDayAverage) * 100;
    
    if (Math.abs(percentChange) > 5) {
      descriptions.push(`This is ${percentChange > 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(1)}% from the 20-day average of ${twentyDayAverage.toFixed(2)}.`);
    } else {
      descriptions.push(`This is near the 20-day average of ${twentyDayAverage.toFixed(2)}.`);
    }
  }
  
  if (totalPutCallRatio > 1.2) {
    descriptions.push('High put/call ratios indicate bearish sentiment, often a contrarian bullish signal.');
  } else if (totalPutCallRatio < 0.7) {
    descriptions.push('Low put/call ratios show bullish sentiment, potentially a contrarian bearish signal.');
  } else {
    descriptions.push('This level indicates balanced market sentiment.');
  }
  
  return descriptions;
}

/**
 * Format a numeric value with a + or - sign
 */
export function formatWithSign(value: number): string {
  return value >= 0 ? `+${value.toFixed(2)}` : `${value.toFixed(2)}`;
} 