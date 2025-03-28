'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, Clock, Info, RefreshCw, Loader2 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { YieldCurveData } from '@/lib/api/types';
import { storeYieldCurveDataLocally, getYieldCurveDataFromLocalStorage } from '@/lib/storage/yield-curve-storage';


interface ChartDataPoint {
  date: string;
  value: number;
  isoDate?: string;
  displayDate?: string;
}

interface SparklineDataPoint {
  date: string;
  value: number;
  isoDate?: string;
}

export function formatChartData(sparklineData: SparklineDataPoint[]): ChartDataPoint[] {
  // Ensure we have valid data
  if (!sparklineData || sparklineData.length === 0) {
    console.error('No sparkline data to format for chart');
    return [];
  }
  
  console.log("ORIGINAL SPARKLINE DATA (FIRST 3):", sparklineData.slice(0, 3));
  
  // Direct conversion to handle special cases
  const formattedData: ChartDataPoint[] = [];
  
  // First process all the points to ensure proper mapping
  for (const point of sparklineData) {
    // Ensure the value is actually a number (not a string)
    let numericValue = typeof point.value === 'string' 
      ? parseFloat(point.value) 
      : point.value;
      
    // Ensure it's a valid number
    if (isNaN(numericValue)) {
      console.error('Invalid numeric value in sparkline data:', point);
      continue;
    }
    
    // Ensure the value is actually a decimal (like 0.005), not a percentage (like 0.5%)
    // If value is too large (> 1 or < -1), assume it's already multiplied and convert back
    if (numericValue > 1 || numericValue < -1) {
      console.warn(`Value ${numericValue} appears to be in percentage form, converting to decimal`);
      numericValue = numericValue / 100;
    }
    
    formattedData.push({
      date: point.date,
      value: numericValue, // Use the numeric value
      isoDate: point.isoDate
    });
  }
  
  console.log("PROCESSED DATA (FIRST 3):", formattedData.slice(0, 3));
  
  // Sort by ISO date if available or use formatted date with current year
  formattedData.sort((a, b) => {
    if (a.isoDate && b.isoDate) {
      return new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime();
    }
    
    const yearNow = new Date().getFullYear();
    const dateA = new Date(`${a.date} ${yearNow}`);
    const dateB = new Date(`${b.date} ${yearNow}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Add displayDate property for better display on charts
  const processedData = formattedData.map((point, index) => {
    // Only show every 5th date on the x-axis to avoid crowding
    // But always show the first and last point
    const showLabel = index === 0 || index === formattedData.length - 1 || index % 5 === 0;
    return {
      ...point,
      displayDate: showLabel ? point.date : ''
    };
  });
  
  // Log in decimal format for debugging (more clear than showing as %)
  console.log('Final chart data points:', processedData.slice(0, 3).map((p: ChartDataPoint) => 
    `${p.date} (${p.isoDate || 'no-iso'}): Value=${p.value} (${(p.value * 100).toFixed(2)}%)`
  ));
  
  // Check the range to help with debugging
  if (processedData.length > 0) {
    const values = processedData.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    console.log(`Chart data range: ${(min * 100).toFixed(2)}% to ${(max * 100).toFixed(2)}%`);
  }
  
  return processedData;
}

/**
 * Get a human-readable description of the yield curve status
 */
function getYieldCurveDescription(data: YieldCurveData): string {
  const { spread } = data;
  
  if (spread === undefined || spread === null) {
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function YieldCurveDialog() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [data, setData] = useState<YieldCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // Simplified fetchData function that prioritizes Supabase data
  const fetchData = async (timeframe: string) => {
    try {
      setLoadingMessage(loading ? "Loading data..." : "Updating timeframe...");
      
      // First, let's clear any existing cached data to ensure we get fresh data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`yieldCurveData_${timeframe}`);
          localStorage.removeItem('yieldCurveData');
          console.log('Cleared existing cached data to ensure fresh data load');
        } catch (e) {
          // Ignore errors from localStorage operations
        }
      }
      
      // Construct URL for Supabase endpoint
      const url = `/api/indicators/yield-curve?period=${timeframe}&source=supabase&_=${Date.now()}`;
      console.log('Fetching data from:', url);
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      let yieldData = await response.json();
      console.log('API RESPONSE RAW DATA:', JSON.stringify(yieldData));
      
      // Validate the data
      if (!yieldData || typeof yieldData !== 'object') {
        throw new Error('Invalid response format from API');
      }
      
      if (!Array.isArray(yieldData.sparklineData) || yieldData.sparklineData.length === 0) {
        throw new Error('No sparkline data in response');
      }
      
      // Ensure all numbers are properly formatted
      const processedData = {
        ...yieldData,
        spread: typeof yieldData.spread === 'string' ? parseFloat(yieldData.spread) : yieldData.spread,
        tenYearYield: typeof yieldData.tenYearYield === 'string' ? parseFloat(yieldData.tenYearYield) : yieldData.tenYearYield,
        twoYearYield: typeof yieldData.twoYearYield === 'string' ? parseFloat(yieldData.twoYearYield) : yieldData.twoYearYield,
        change: typeof yieldData.change === 'string' ? parseFloat(yieldData.change) : yieldData.change,
        sparklineData: yieldData.sparklineData.map((point: SparklineDataPoint) => ({
          ...point,
          value: typeof point.value === 'string' ? parseFloat(point.value) : point.value
        })),
        timeframe,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('PROCESSED DATA FROM API:', {
        spread: processedData.spread,
        tenYearYield: processedData.tenYearYield,
        twoYearYield: processedData.twoYearYield,
        change: processedData.change,
        sampleValues: processedData.sparklineData.slice(0, 3).map((p: SparklineDataPoint) => p.value)
      });
      
      // Store the processed data in local storage for future use
      storeYieldCurveDataLocally(processedData);
      
      // Update the UI
      setData(processedData);
      setLastUpdated(new Date());
      setDataSource('Supabase');
      setError(null);
    } catch (err) {
      console.error('Error fetching yield curve data:', err);
      
      // Use cached data as fallback
      const cachedData = getYieldCurveDataFromLocalStorage(timeframe);
      if (cachedData) {
        setData(cachedData);
        setDataSource('LocalStorage (fallback)');
        setLastUpdated(new Date(cachedData.lastUpdated || new Date()));
        setError('Unable to fetch latest data. Using cached data.');
      } else {
        setError('Failed to load yield curve data and no cached data available');
      }
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  // Load data whenever timeframe changes
  useEffect(() => {
    // First try to get data from local storage immediately
    const cachedData = getYieldCurveDataFromLocalStorage(selectedTimeframe);
    
    if (cachedData) {
      // Immediately display cached data
      setData(cachedData);
      setLastUpdated(new Date(cachedData.lastUpdated || new Date()));
      setLoading(false);
      setDataSource('LocalStorage');
      
      // Only fetch fresh data if cached data is older than 15 minutes
      const cachedTime = new Date(cachedData.lastUpdated || 0).getTime();
      const now = new Date().getTime();
      const fifteenMinutesMs = 15 * 60 * 1000;
      
      if (now - cachedTime > fifteenMinutesMs) {
        // Refresh in background without showing loading state
        fetchData(selectedTimeframe);
      }
    } else {
      // No cached data, need to fetch
      fetchData(selectedTimeframe);
    }
  }, [selectedTimeframe]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (!loading) {
      fetchData(selectedTimeframe);
    }
  };

  // One-time cleanup on mount to ensure we're working with fresh data
  useEffect(() => {
    // Clear local storage on first load to ensure we get fresh data
    if (typeof window !== 'undefined') {
      try {
        console.log('ONE-TIME CLEANUP: Clearing all yield curve data from local storage');
        localStorage.removeItem('app:yield_curve_data_cache');
        
        // Also clear any old format cached data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('yieldCurveData') || key.includes('yield_curve'))) {
            console.log(`Removing old cached data: ${key}`);
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Ignore errors from localStorage operations
        console.error('Error clearing local storage:', e);
      }
    }
  }, []);

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="mb-2 flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
        {loadingMessage && (
          <div className="text-sm text-muted-foreground">{loadingMessage}</div>
        )}
      </div>
    );
  }

  // Complete error state (no data available)
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <div className="text-red-600">{error}</div>
        <p className="text-muted-foreground text-center max-w-md">
          Unable to retrieve yield curve data. This may be due to temporary database issues or network problems.
        </p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Debug output to verify the data we're working with
  console.log('DATA FOR CHART:', data ? {
    spread: data.spread,
    tenYearYield: data.tenYearYield,
    twoYearYield: data.twoYearYield,
    dataPoints: data.sparklineData?.length || 0,
    samplePoints: data.sparklineData?.slice(0, 3)
  } : 'No data');

  // We have data, but possibly with warning
  const chartData = data?.sparklineData ? formatChartData(data.sparklineData) : [];
  const isNegative = data?.spread ? data.spread < 0 : false;
  const changeDirection = data?.change !== undefined && data.change !== null ? data.change < 0 : false;
  
  // Calculate appropriate chart domain based on actual data
  const calculateChartDomain = (): [number, number] => {
    if (!chartData || chartData.length === 0) {
      // Default domain if no data
      return isNegative ? [-0.01, 0.01] : [0, 0.01];
    }
    
    // Get min and max values from the data
    const values = chartData.map(point => point.value);
    console.log("RAW CHART VALUES:", values);
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    console.log(`Min value: ${minValue} (${minValue * 100}%), Max value: ${maxValue} (${maxValue * 100}%)`);
    
    // Determine if we need negative values in the domain
    const needsNegativeDomain = minValue < 0;
    
    // Add some padding (20%) for better visualization
    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.2;
    
    if (needsNegativeDomain) {
      // Domain with negative and positive values
      return [
        Math.min(minValue - padding, -0.0001), // Ensure we always show the zero line
        Math.max(maxValue + padding, 0.0001)   // Ensure we always show the zero line
      ];
    } else {
      // Domain with only positive values
      return [0, maxValue + padding];
    }
  };
  
  // Get the chart domain based on data
  const chartDomain = calculateChartDomain();
  
  // Format values for display
  const formattedValue = data?.spread !== undefined ? `${(data.spread * 100).toFixed(2)}%` : 'N/A';
  const formattedChange = data?.change !== undefined && data.change !== null
    ? `${data.change > 0 ? '+' : ''}${(data.change * 100).toFixed(2)}%` 
    : '';
  
  return (
    <div className="space-y-6 px-2 pb-12 max-w-4xl mx-auto">
      {/* Header section with title and current value */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Yield Curve</h2>
          <p className="text-muted-foreground">10Y-2Y Treasury Spread</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {data?.latestDataDate && (
                <> • Latest data: {formatDate(data.latestDataDate)}</>
              )}
              {dataSource && (
                <> • Source: <span className="font-medium">{dataSource}</span></>
              )}
            </p>
          )}
          {error && (
            <div className="mt-2 flex items-center">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                <AlertCircle className="h-3 w-3 mr-1" /> 
                {error}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="mr-2"
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Refresh
          </Button>
          <span className={cn(
            "text-2xl font-bold", 
            isNegative ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          )}>
            {formattedValue}
          </span>
          {formattedChange && (
            <span className={cn(
              "text-sm font-medium",
              changeDirection ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            )}>
              {formattedChange}
            </span>
          )}
          {data?.spread !== undefined && (
            <Badge variant="outline" className={cn(
              "ml-2",
              isNegative 
                ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" 
                : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
            )}>
              {isNegative ? "Inverted" : "Normal"}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Status indicator */}
      {isNegative && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">Warning: Yield Curve Inversion</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {data && getYieldCurveDescription(data)}
            </p>
          </div>
        </div>
      )}
      
      {/* Timeframe selector */}
      <Tabs defaultValue={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
        <TabsList className="grid grid-cols-6 w-full md:w-[400px]">
          <TabsTrigger value="1m">1M</TabsTrigger>
          <TabsTrigger value="3m">3M</TabsTrigger>
          <TabsTrigger value="6m">6M</TabsTrigger>
          <TabsTrigger value="1y">1Y</TabsTrigger>
          <TabsTrigger value="2y">2Y</TabsTrigger>
          <TabsTrigger value="5y">5Y</TabsTrigger>
        </TabsList>

        {/* Chart content - shared across all tabs */}
        <div className="mt-6 border rounded-lg p-4 bg-card dark:bg-card">
          {data?.status === 'error' && chartData.length > 0 && (
            <div className="mb-2 text-xs text-amber-600 dark:text-amber-400 italic flex items-center">
              <Info className="h-3 w-3 mr-1" /> 
              Displaying estimated data based on historical patterns
            </div>
          )}
          <div className="h-[300px] w-full">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date"
                    height={30}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value, index) => {
                      // Only display certain dates to prevent crowding
                      const point = chartData[index];
                      return point?.displayDate || '';
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
                    domain={chartDomain}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Spread (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Yield Spread']}
                    labelFormatter={(label: string) => label}
                    contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', color: '#fff', border: 'none', borderRadius: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isNegative ? '#EF4444' : '#10B981'}
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Add zero reference line */}
                  <ReferenceLine 
                    y={0} 
                    stroke="#666" 
                    strokeDasharray="3 3" 
                    label={{ value: "0%", position: "right", fill: "#666" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">No chart data available</div>
              </div>
            )}
          </div>
        </div>
      </Tabs>
      
      {/* Yield stats section */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">10-Year Treasury Yield</CardTitle>
              {data.status === 'error' && (
                <span className="text-xs text-amber-600 dark:text-amber-400 italic">Estimated</span>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{data.tenYearYield.toFixed(2)}%</span>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">2-Year Treasury Yield</CardTitle>
              {data.status === 'error' && (
                <span className="text-xs text-amber-600 dark:text-amber-400 italic">Estimated</span>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{data.twoYearYield.toFixed(2)}%</span>
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Historical context section */}
      {data?.lastInversion && (
        <Card className="mt-6 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Historical Context
            </CardTitle>
            <CardDescription>Previous yield curve inversions and economic impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Last Inversion:</span>
                <span className="text-base">{formatDate(data.lastInversion.date)}</span>
                <span className="text-sm text-muted-foreground">Duration: {data.lastInversion.duration}</span>
              </div>
              
              {data.lastInversion.followedByRecession && (
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">Followed by Recession:</span>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-base">Yes - Beginning {formatDate(data.lastInversion.recessionStart || '')}</span>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <span className="font-medium">About Yield Curve Inversions:</span> A yield curve inversion occurs when short-term Treasury yields exceed long-term yields.
                </p>
                <p>
                  Historically, yield curve inversions have preceded economic recessions by 6-24 months, though not all inversions lead to recessions. 
                  Since 1955, all recessions were preceded by yield curve inversions, making this a closely watched economic indicator.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t">
            <div className="flex items-start space-x-2 text-sm">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Investors should note that while yield curve inversions are historically reliable recession predictors, 
                the timing between inversion and recession varies significantly.
              </p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
