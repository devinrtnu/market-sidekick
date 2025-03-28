'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, Clock, Info, RefreshCw } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

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
import { fetchYieldCurveData, storeYieldCurveDataLocally, getYieldCurveDataFromLocalStorage } from '@/lib/api/fred';


interface ChartDataPoint {
  date: string;
  value: number;
  isoDate?: string;
}

interface SparklineDataPoint {
  date: string;
  value: number;
  isoDate?: string;
}

function formatChartData(sparklineData: SparklineDataPoint[]): ChartDataPoint[] {
  // Ensure we have valid data
  if (!sparklineData || sparklineData.length === 0) {
    console.error('No sparkline data to format for chart');
    return [];
  }
  
  console.log('Formatting chart data, raw input:', sparklineData.map(d => ({
    date: d.date,
    isoDate: d.isoDate,
    value: d.value
  })));
  
  // Direct conversion to handle special cases
  let formattedData: ChartDataPoint[] = [];
  
  // First process all the points to ensure proper mapping
  for (const point of sparklineData) {
    // Create a chart data point for each input point
    // The value is already in decimal format from the API and formatSparklineData
    // We multiply by 100 to convert to percentage for display
    formattedData.push({
      date: point.date,
      value: point.value * 100, // Convert decimal to percentage for display
      isoDate: point.isoDate
    });
  }
  
  // Sort by ISO date if available
  formattedData.sort((a, b) => {
    // If we have ISO dates, use those for accurate sorting
    if (a.isoDate && b.isoDate) {
      return new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime();
    }
    
    // Otherwise fall back to parsing the formatted dates
    const yearNow = new Date().getFullYear();
    const dateA = new Date(`${a.date} ${yearNow}`);
    const dateB = new Date(`${b.date} ${yearNow}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  console.log('Final chart data points:', formattedData.map(p => `${p.date} (${p.isoDate || 'no-iso'}): ${p.value.toFixed(2)}%`));
  
  return formattedData;
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
  const [retryCount, setRetryCount] = useState(0);

  // Check for cached data on initial load
  useEffect(() => {
    const cachedData = getYieldCurveDataFromLocalStorage();
    if (cachedData && !data) {
      console.log('Using cached yield curve data from local storage');
      setData(cachedData);
      setLastUpdated(new Date());
      setLoading(false);
      // We still fetch fresh data but have something to show immediately
      fetchData(true);
    }
  }, []);

  // Function to fetch data with optional force refresh
  const fetchData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching yield curve data with timeframe: ${selectedTimeframe}, forceRefresh: ${forceRefresh}`);
      const yieldData = await fetchYieldCurveData(selectedTimeframe, forceRefresh);
      
      // Check if we received data with an error status
      if (yieldData.status === 'error') {
        console.warn('Yield curve data returned with error status');
        setError('Data source temporarily unavailable. Using cached data if available.');
      } else {
        setError(null);
        // Store successful data in local storage for future visits
        storeYieldCurveDataLocally(yieldData);
      }
      
      // Log the data dates to verify we're getting the most recent data
      if (yieldData.sparklineData && yieldData.sparklineData.length > 0) {
        console.log('Yield curve sparkline dates:', {
          dataPoints: yieldData.sparklineData.length,
          dates: yieldData.sparklineData.map(point => point.date).join(', '),
          latestDate: yieldData.sparklineData[yieldData.sparklineData.length - 1].date
        });
      } else {
        console.warn('No sparkline data available in yield curve response');
      }
      
      setData(yieldData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching yield curve data:', err);
      
      // Try to use local storage data as fallback if we don't already have data
      if (!data) {
        const cachedData = getYieldCurveDataFromLocalStorage();
        if (cachedData) {
          console.log('Using cached yield curve data from local storage after fetch error');
          setData(cachedData);
          setError('Unable to fetch latest data. Using cached data.');
        } else {
          setError('Failed to load yield curve data');
          setData(null);
        }
      } else {
        // Keep existing data if we have it, just show error message
        setError('Failed to refresh data. Using previously loaded data.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
    fetchData(true);
  };

  // Fetch data when timeframe changes or on retry
  React.useEffect(() => {
    fetchData(true);
  }, [selectedTimeframe, retryCount]);

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Complete error state (no data available)
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <div className="text-red-600">{error}</div>
        <p className="text-muted-foreground text-center max-w-md">
          Unable to retrieve yield curve data from the Federal Reserve Economic Data (FRED) service. 
          This may be due to temporary API limitations or network issues.
        </p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // We have data, but possibly with warning
  const chartData = data?.sparklineData ? formatChartData(data.sparklineData) : [];
  const isNegative = data?.spread ? data.spread < 0 : false;
  const changeDirection = data?.change ? data.change < 0 : false;
  
  // Format values for display
  const formattedValue = data?.spread !== undefined ? `${(data.spread * 100).toFixed(2)}%` : 'N/A';
  const formattedChange = data?.change !== undefined 
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
                    hide={true}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value.toFixed(2)}%`}
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Yield Spread']}
                    labelFormatter={(label) => formatDate(label as string)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isNegative ? '#EF4444' : '#10B981'}
                    strokeWidth={2}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Special line just for March 27th data point */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    data={chartData.filter(point => 
                      point.date === 'Mar 27' || (point.isoDate && point.isoDate.includes('2025-03-27'))
                    )}
                    stroke="transparent"
                    strokeWidth={0}
                    dot={{
                      r: 5,
                      fill: isNegative ? '#EF4444' : '#10B981',
                      stroke: 'white',
                      strokeWidth: 2
                    }}
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
