'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VixData {
  currentVix: number | null;
  historicalPercentile: number | null;
  value: number | null;
  timestamp: number;
  status: 'normal' | 'warning' | 'danger' | 'error';
  error?: string;
  termStructure: {
    oneMonth: number | null;
    threeMonth: number | null;
    sixMonth: number | null;
  };
  change?: number | null;
}

interface HistoricalDataPoint {
  date: number;
  value: number;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function VixDialog() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('6mo');
  const [data, setData] = useState<VixData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch current VIX data
  const fetchVixData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      console.log(`Fetching VIX data, forceRefresh: ${forceRefresh}`);
      
      // Set cache control headers if forcing refresh
      const options = forceRefresh ? {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      } : {};
      
      const response = await fetch('/api/indicators/vix', options);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch VIX data: ${response.status}`);
      }
      
      const vixData: VixData = await response.json();
      setData(vixData);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching VIX data:', err);
      setError('Failed to load VIX data');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch historical VIX data
  const fetchHistoricalData = async () => {
    try {
      const response = await fetch(`/api/indicators/vix/history?range=${selectedTimeframe}&interval=1d`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch VIX historical data: ${response.status}`);
      }
      
      const result = await response.json();
      setHistoricalData(result.data || []);
    } catch (err) {
      console.error('Error fetching VIX historical data:', err);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchVixData(true);
    fetchHistoricalData();
  };

  // Fetch data when component mounts or timeframe changes
  useEffect(() => {
    fetchVixData();
    fetchHistoricalData();
  }, [selectedTimeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <div className="text-red-600">{error || 'Failed to load VIX data'}</div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Format values for display
  const formattedValue = data.currentVix !== null ? data.currentVix.toFixed(2) : 'N/A';
  const formattedChange = data.change !== null && data.change !== undefined 
    ? (data.change > 0 ? '+' : '') + data.change.toFixed(2)
    : '';

  const isHighVix = data.currentVix !== null && data.currentVix > 30;
  const isElevatedVix = data.currentVix !== null && data.currentVix > 20 && data.currentVix <= 30;
  const isLowVix = data.currentVix !== null && data.currentVix < 15;
  
  return (
    <div className="space-y-6 px-2 pb-12 max-w-4xl mx-auto">
      {/* Header section with title and current value */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">VIX (Fear Index)</h2>
          <p className="text-muted-foreground">Market Volatility Expectation</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
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
          <span className="text-2xl font-bold">
            {formattedValue}
          </span>
          {formattedChange && (
            <span className={cn(
              "text-sm font-medium",
              data.change && data.change < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {formattedChange}
            </span>
          )}
          <Badge variant="outline" className={cn(
            "ml-2",
            data.status === 'danger' 
              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" 
              : data.status === 'warning'
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
          )}>
            {data.status === 'danger' ? 'High Fear' : data.status === 'warning' ? 'Elevated' : 'Normal'}
          </Badge>
        </div>
      </div>
      
      {/* Status indicator */}
      {isHighVix && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">High Market Fear</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              The VIX is currently at elevated levels, indicating significant market fear and uncertainty.
              This suggests investors anticipate large market swings in the near future and have increased
              demand for protective put options.
            </p>
          </div>
        </div>
      )}
      
      {isElevatedVix && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Elevated Market Uncertainty</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              The VIX is showing elevated levels, signaling increased market uncertainty.
              Investors are anticipating more volatility than normal in the coming weeks.
            </p>
          </div>
        </div>
      )}
      
      {isLowVix && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-300">Market Complacency</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              The VIX is at very low levels, indicating potential market complacency.
              Historically, extremely low VIX readings have sometimes preceded market corrections
              as investors may be underestimating potential risks.
            </p>
          </div>
        </div>
      )}
      
      {/* Timeframe selector */}
      <Tabs defaultValue={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
        <TabsList className="grid grid-cols-5 w-full md:w-[400px]">
          <TabsTrigger value="1mo">1M</TabsTrigger>
          <TabsTrigger value="3mo">3M</TabsTrigger>
          <TabsTrigger value="6mo">6M</TabsTrigger>
          <TabsTrigger value="1y">1Y</TabsTrigger>
          <TabsTrigger value="5y">5Y</TabsTrigger>
        </TabsList>

        {/* Chart content - shared across all tabs */}
        <div className="mt-6 border rounded-lg p-4 bg-card dark:bg-card">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historicalData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    
                    if (selectedTimeframe === '1mo' || selectedTimeframe === '3mo' || selectedTimeframe === '6mo') {
                      // For shorter timeframes, show day and month
                      return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      });
                    } else {
                      // For longer timeframes, show month and year
                      return date.toLocaleDateString('en-US', { 
                        month: 'short',
                        year: 'numeric'
                      });
                    }
                  }}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  interval="preserveEnd"
                  minTickGap={30}
                />
                <YAxis 
                  domain={[0, 'auto']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}`, 'VIX']}
                  labelFormatter={(label) => formatDate(label as number)}
                />
                <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Elevated (20)', position: 'right', fill: '#F59E0B', fontSize: 12 }} />
                <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'High Fear (30)', position: 'right', fill: '#EF4444', fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Tabs>
      
      {/* Term structure section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">1-Month VIX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {data.termStructure.oneMonth !== null ? data.termStructure.oneMonth.toFixed(2) : 'N/A'}
              </span>
              {data.termStructure.oneMonth !== null && data.currentVix !== null && (
                data.termStructure.oneMonth > data.currentVix 
                  ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">3-Month VIX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {data.termStructure.threeMonth !== null ? data.termStructure.threeMonth.toFixed(2) : 'N/A'}
              </span>
              {data.termStructure.threeMonth !== null && data.currentVix !== null && (
                data.termStructure.threeMonth > data.currentVix 
                  ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">6-Month VIX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {data.termStructure.sixMonth !== null ? data.termStructure.sixMonth.toFixed(2) : 'N/A'}
              </span>
              {data.termStructure.sixMonth !== null && data.currentVix !== null && (
                data.termStructure.sixMonth > data.currentVix 
                  ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* VIX Information Box */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About the VIX</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            The VIX, often called the "fear gauge" of the market, measures expected volatility of the S&P 500 over the next 30 days.
            It is calculated from S&P 500 options prices and represents the market's expectation of future volatility.
          </p>
          
          <div className="space-y-2">
            <p className="font-medium">How to interpret VIX levels:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Below 15:</span> Low volatility, potential complacency</li>
              <li><span className="font-medium">15-20:</span> Normal market conditions</li>
              <li><span className="font-medium">20-30:</span> Elevated uncertainty</li>
              <li><span className="font-medium">Above 30:</span> High fear, significant market stress</li>
              <li><span className="font-medium">Above 40:</span> Extreme market fear, crisis conditions</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium">Term Structure Analysis:</p>
            <p>
              The VIX term structure (comparing current VIX with 1-month, 3-month, and 6-month values) provides insight into market expectations:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium">Contango (upward slope):</span> Normal market conditions where longer-dated VIX futures are higher
              </li>
              <li>
                <span className="font-medium">Backwardation (downward slope):</span> Market stress where near-term volatility expectations exceed long-term
              </li>
            </ul>
          </div>
          
          {data.historicalPercentile !== null && (
            <p>
              <span className="font-medium">Current Historical Context:</span> The current VIX reading is in the {data.historicalPercentile}th 
              percentile of historical values, suggesting {data.historicalPercentile > 80 ? 'extremely high volatility expectations compared to historical norms' : 
                data.historicalPercentile > 60 ? 'above-average volatility expectations' : 
                data.historicalPercentile > 40 ? 'average volatility expectations' : 
                data.historicalPercentile > 20 ? 'below-average volatility expectations' : 
                'extremely low volatility expectations compared to historical norms'}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 