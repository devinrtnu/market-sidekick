import { z } from 'zod';
import { YieldCurveData } from '@/lib/api/types';
import { LocalStorage } from '@/lib/storage';

// Define schemas for sparkline data point with more flexible validation
const SparklineDataPointSchema = z.object({
  date: z.string(),
  value: z.union([z.number(), z.string().transform(val => parseFloat(val))]),
  isoDate: z.string().optional()
});

// Define schema for yield curve data cache
const YieldCurveStorageSchema = z.object({
  data: z.object({
    title: z.string(),
    value: z.string(),
    change: z.union([z.number(), z.null()]),
    sparklineData: z.array(SparklineDataPointSchema),
    status: z.enum(['normal', 'warning', 'danger', 'error', 'good']),
    spread: z.union([z.number(), z.string().transform(val => parseFloat(val))]),
    tenYearYield: z.union([z.number(), z.string().transform(val => parseFloat(val)), z.null()]),
    twoYearYield: z.union([z.number(), z.string().transform(val => parseFloat(val)), z.null()]),
    lastUpdated: z.string(),
    latestDataDate: z.string().optional(),
    timeframe: z.string().optional(),
    source: z.string().optional()
  }),
  timestamp: z.number(),
  expiresAt: z.number()
});

// Type for the YieldCurveStorage
type YieldCurveStorageType = z.infer<typeof YieldCurveStorageSchema>;

// Create a type-safe LocalStorage instance for yield curve data
const yieldCurveStorage = new LocalStorage(
  'yield_curve_data_cache',
  YieldCurveStorageSchema,
  { prefix: 'app' }
);

// Helper to store yield curve data with expiry
export function storeYieldCurveDataLocally(data: YieldCurveData): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Validate data before storing
    if (!data || typeof data !== 'object') {
      console.error('Invalid yield curve data provided for local storage', data);
      return;
    }
    
    // Log what we're storing for debugging
    console.log('STORING IN LOCAL STORAGE:', {
      spread: data.spread,
      sample: data.sparklineData?.slice(0, 2)
    });
    
    // Normalize any numeric string values to numbers
    const normalizedData = {
      ...data,
      spread: typeof data.spread === 'string' ? parseFloat(data.spread) : data.spread,
      tenYearYield: typeof data.tenYearYield === 'string' ? parseFloat(data.tenYearYield) : data.tenYearYield,
      twoYearYield: typeof data.twoYearYield === 'string' ? parseFloat(data.twoYearYield) : data.twoYearYield,
      sparklineData: data.sparklineData?.map(point => {
        // Ensure value is a proper decimal (between -1 and 1 for yield spread)
        let value = typeof point.value === 'string' ? parseFloat(point.value) : point.value;
        
        // Fix excessive values - if number is outside typical yield spread range (-1 to 1), 
        // assume it's a percentage and convert to decimal
        if (value > 1 || value < -1) {
          console.warn(`Value ${value} appears to be a percentage value, converting to decimal`);
          value = value / 100;
        }
        
        return {
          ...point,
          value
        };
      }) || []
    };
    
    // Prepare data with expiry (24 hours)
    const dataToStore: YieldCurveStorageType = {
      data: normalizedData as any,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiry
    };
    
    // Store using our type-safe storage utility
    yieldCurveStorage.set(dataToStore);
    console.log('Stored yield curve data in local storage until', new Date(dataToStore.expiresAt).toLocaleString());
  } catch (error) {
    console.error('Failed to store yield curve data in local storage:', error);
  }
}

// Helper to retrieve yield curve data from local storage
export function getYieldCurveDataFromLocalStorage(timeframe: string = '1m'): YieldCurveData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get data from type-safe storage
    const storedData = yieldCurveStorage.get();
    
    if (!storedData) {
      console.log('No yield curve data found in local storage');
      return null;
    }
    
    // Check if data is expired
    if (!storedData.expiresAt || storedData.expiresAt < Date.now()) {
      console.log('Cached yield curve data is expired, removing from local storage');
      yieldCurveStorage.remove();
      return null;
    }
    
    // Only return data for the requested timeframe if it matches
    if (storedData.data?.timeframe && storedData.data.timeframe !== timeframe) {
      console.log('Cached data is for a different timeframe, not using it');
      return null;
    }
    
    console.log('Retrieved yield curve data from local storage', {
      timestamp: new Date(storedData.timestamp).toISOString(),
      expires: new Date(storedData.expiresAt).toISOString(),
      timeframe: timeframe,
      spread: storedData.data.spread
    });
    
    return storedData.data as YieldCurveData;
  } catch (error) {
    console.error('Failed to retrieve yield curve data from local storage:', error);
    // Try to clean up possibly corrupted data
    try {
      yieldCurveStorage.remove();
    } catch (e) {
      // Ignore cleanup errors
    }
    return null;
  }
} 