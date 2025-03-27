'use client'

import React, { useState } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, Clock, Info } from 'lucide-react'
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
import { cn } from '@/lib/utils'

// Interface for Yield Curve Data
interface YieldCurveData {
  currentValue: number;
  change: number;
  tenYearYield: number;
  twoYearYield: number;
  timeframeData: {
    [key: string]: { // '1M', '3M', '6M', '1Y', '2Y', '5Y'
      dates: string[];
      values: number[];
    }
  };
  lastInversion?: {
    date: string;
    duration: string;
    followedByRecession: boolean;
    recessionStart?: string;
  };
}

// Helper function to create consistent mock data patterns
function createPatternData(type: string, count: number): number[] {
  switch(type) {
    case '1M':
      // Generate data showing a recent mild downturn
      return Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        return -0.45 + 0.15 * Math.sin(progress * 8) - 0.1 * progress;
      });
    
    case '3M':
      // More volatile with a downward trend
      return Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        return -0.35 - 0.2 * progress + 0.1 * Math.sin(progress * 12);
      });
    
    case '6M':
      // Extended volatility with overall downward trend
      return Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        return -0.2 - 0.3 * progress + 0.15 * Math.sin(progress * 10);
      });
    
    case '1Y':
      // Year-long trend from positive to negative
      return Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        return 0.8 - 1.3 * progress + 0.1 * Math.sin(progress * 8);
      });
    
    case '2Y':
      // Two-year transition showing the inversion developing
      return Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        if (progress < 0.4) return 1.2 - 2 * progress;
        if (progress < 0.7) return -0.2 - progress + 0.1 * Math.sin(progress * 20);
        return -0.6 + 0.15 * Math.sin(progress * 15);
      });
    
    case '5Y':
      // Five-year cycle showing previous normal curve, covid inversion, recovery, and new inversion
      return Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        if (progress < 0.2) return 0.5 - 2.5 * progress; // Initial normal to slight inversion
        if (progress < 0.3) return -0.8 + 0.1 * Math.sin(progress * 30); // Covid deep inversion
        if (progress < 0.6) return -0.8 + 2 * (progress - 0.3); // Recovery to normal
        if (progress < 0.8) return 0.2 - 1.5 * (progress - 0.6); // Recent downturn
        return -0.45 + 0.05 * Math.sin(progress * 40); // Current state
      });
      
    default:
      return Array.from({ length: count }, () => -0.45);
  }
}

// Helper function to generate valid dates
function generateDates(count: number, interval: 'day' | 'month', startDate?: Date): string[] {
  const dates: string[] = [];
  let date = startDate ? new Date(startDate) : new Date();
  
  // Start from a nice round date if no start date provided
  if (!startDate) {
    date = new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  // Go back in time by count intervals
  if (interval === 'day') {
    date.setDate(date.getDate() - count + 1);
  } else {
    date.setMonth(date.getMonth() - count + 1);
  }
  
  // Generate dates
  for (let i = 0; i < count; i++) {
    const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    dates.push(isoDate);
    
    if (interval === 'day') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
  }
  
  return dates;
}

// Mock data for development and testing
const mockYieldCurveData: YieldCurveData = {
  currentValue: -0.45,
  change: -0.05,
  tenYearYield: 4.23,
  twoYearYield: 4.68,
  timeframeData: {
    '1M': {
      dates: generateDates(30, 'day'),
      values: createPatternData('1M', 30)
    },
    '3M': {
      dates: generateDates(90, 'day'),
      values: createPatternData('3M', 90)
    },
    '6M': {
      dates: generateDates(180, 'day'),
      values: createPatternData('6M', 180)
    },
    '1Y': {
      dates: generateDates(12, 'month'),
      values: createPatternData('1Y', 12)
    },
    '2Y': {
      dates: generateDates(24, 'month'),
      values: createPatternData('2Y', 24)
    },
    '5Y': {
      dates: generateDates(60, 'month', new Date(2019, 0, 1)),
      values: createPatternData('5Y', 60)
    }
  },
  lastInversion: {
    date: '2019-05-23',
    duration: '10 months',
    followedByRecession: true,
    recessionStart: '2020-02-01'
  }
};

interface ChartDataPoint {
  date: string;
  value: number;
}

function formatChartData(timeframeData: YieldCurveData['timeframeData'][string]): ChartDataPoint[] {
  return timeframeData.dates.map((date, index) => ({
    date,
    value: timeframeData.values[index]
  }));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function YieldCurveDialog() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1M');
  const data = mockYieldCurveData; // In a real app, this would come from props or a data fetching hook
  
  const chartData = formatChartData(data.timeframeData[selectedTimeframe]);
  const isNegative = data.currentValue < 0;
  const changeDirection = data.change < 0;
  
  // Format the current value for display
  const formattedValue = `${data.currentValue.toFixed(2)}%`;
  const formattedChange = `${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%`;
  
  return (
    <div className="space-y-6 px-2 pb-12 max-w-4xl mx-auto">
      {/* Header section with title and current value */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Yield Curve</h2>
          <p className="text-muted-foreground">10Y-2Y Treasury Spread</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={cn(
            "text-2xl font-bold", 
            isNegative ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          )}>
            {formattedValue}
          </span>
          <span className={cn(
            "text-sm font-medium",
            changeDirection ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          )}>
            {formattedChange}
          </span>
          <Badge variant="outline" className={cn(
            "ml-2",
            isNegative 
              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" 
              : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
          )}>
            {isNegative ? "Inverted" : "Normal"}
          </Badge>
        </div>
      </div>
      
      {/* Status indicator */}
      {isNegative && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">Warning: Yield Curve Inversion</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              The yield curve is currently inverted, which has historically preceded economic recessions.
              This indicates that investors expect lower interest rates in the future, often due to economic weakness.
            </p>
          </div>
        </div>
      )}
      
      {/* Timeframe selector */}
      <Tabs defaultValue={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
        <TabsList className="grid grid-cols-6 w-full md:w-[400px]">
          <TabsTrigger value="1M">1M</TabsTrigger>
          <TabsTrigger value="3M">3M</TabsTrigger>
          <TabsTrigger value="6M">6M</TabsTrigger>
          <TabsTrigger value="1Y">1Y</TabsTrigger>
          <TabsTrigger value="2Y">2Y</TabsTrigger>
          <TabsTrigger value="5Y">5Y</TabsTrigger>
        </TabsList>

        {/* Chart content - shared across all tabs */}
        <div className="mt-6 border rounded-lg p-4 bg-card dark:bg-card">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    try {
                      const date = new Date(value);
                      
                      if (selectedTimeframe === '1M' || selectedTimeframe === '3M' || selectedTimeframe === '6M') {
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
                    } catch (e) {
                      return 'Invalid';
                    }
                  }}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  interval="preserveEnd"
                  minTickGap={30}
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
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Tabs>
      
      {/* Yield stats section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">10-Year Treasury Yield</CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{data.twoYearYield.toFixed(2)}%</span>
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Historical context section */}
      {data.lastInversion && (
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
