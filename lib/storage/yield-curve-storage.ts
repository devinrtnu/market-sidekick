import { z } from 'zod';
import { YieldCurveData } from '@/lib/api/types';
import { LocalStorage } from '@/lib/storage';

// Define schemas for sparkline data point
const SparklineDataPointSchema = z.object({
  date: z.string(),
  value: z.number()
});

// Define schema for yield curve data cache
const YieldCurveStorageSchema = z.object({
  data: z.object({
    title: z.string(),
    value: z.string(),
    change: z.number().nullable(),
    sparklineData: z.array(SparklineDataPointSchema),
    status: z.enum(['normal', 'warning', 'danger', 'error']),
    spread: z.number(),
    tenYearYield: z.number().nullable(),
    twoYearYield: z.number().nullable(),
    lastUpdated: z.string(),
    latestDataDate: z.string().optional()
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
    
    // Prepare data with expiry (24 hours)
    const dataToStore: YieldCurveStorageType = {
      data: JSON.parse(JSON.stringify(data)),
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
    
    console.log('Retrieved yield curve data from local storage', {
      timestamp: new Date(storedData.timestamp).toISOString(),
      expires: new Date(storedData.expiresAt).toISOString(),
      timeframe: timeframe
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