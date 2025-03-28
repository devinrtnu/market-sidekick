'use client'; // Mark as a Client Component

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TradingViewChart } from '@/components/tradingview-chart';
import { RefreshCw } from 'lucide-react';

interface SparklineDataPoint {
  date: string; // Or number if using timestamps
  value: number;
}

export interface TopIndicatorProps {
  id?: string;
  title: string;
  value: number | string;
  change: number; // Percentage change
  sparklineData?: SparklineDataPoint[];
  tradingSymbol?: string; // Symbol to use for TradingView chart
}

export function TopIndicatorCard({
  id,
  title,
  value,
  change,
  sparklineData = [],
  tradingSymbol,
}: TopIndicatorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [chartError, setChartError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Reset chart error state when trading symbol changes or dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setChartError(false);
    }
  }, [tradingSymbol, isDialogOpen]);

  const isPositive = change >= 0;
  const changeText = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
  const changeColorClass = isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
  const badgeColorClass = isPositive ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700';
  const sparklineColor = isPositive ? '#16a34a' : '#dc2626'; // green-600 / red-600

  // Generate a unique ID for the gradient if no id prop is provided
  const gradientId = `colorValue-${id || title.replace(/\s+/g, '-')}`;

  const renderChart = () => {
    if (chartError) {
      return <div className="flex items-center justify-center p-6 text-red-500">Failed to load chart</div>;
    }
    
    try {
      return (
        <TradingViewChart 
          symbol={tradingSymbol as string} 
          height="100%" 
          width="100%"
          theme="dark" 
          interval="D"
          chartStyle="1"
          showToolbar={true}
          showGridLines={true}
          backgroundColor="#121212"
          className="h-full w-full" 
        />
      );
    } catch (e) {
      console.error("Error rendering TradingView chart:", e);
      setChartError(true);
      return <div className="flex items-center justify-center p-6 text-red-500">Error loading chart</div>;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div 
          className="h-full cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <Card className={cn(
            "h-full overflow-hidden",
            isHovering && "shadow-md border-white/50 dark:border-white/30"
          )}>
            <CardContent className="px-6 flex items-start justify-between">
              {/* Left Section: Title & Sparkline */}
              <div className="flex flex-col w-[55%] sm:w-[60%] md:w-[65%]"> 
                <p className="text-sm font-medium truncate">{title}</p>
                <div className="h-8 w-[80%] sm:w-[85%] md:w-[75%] xl:w-[85%] 2xl:w-full mt-4 overflow-hidden">
                  {sparklineData && sparklineData.length > 1 && (() => {
                    // Normalize data for better visualization
                    const values = sparklineData.map(d => d.value);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const range = max - min;
                    
                    // Add padding to prevent the line from touching edges
                    const padding = range * 0.15; // Increased padding for better visibility
                    const adjustedMin = min - padding;
                    const adjustedMax = max + padding;
                    const adjustedRange = adjustedMax - adjustedMin;
                    
                    const normalizedData = sparklineData.map(d => ({
                      ...d,
                      value: ((d.value - adjustedMin) / adjustedRange) * 85 + 5 // Scale to 5-90 range for better visibility
                    }));
                    
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={normalizedData}
                          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={sparklineColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotoneX"
                            dataKey="value"
                            stroke={sparklineColor}
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                            isAnimationActive={false}
                            dot={false}
                            connectNulls={true}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>

              {/* Right Section: Value & Change */}
              <div className="flex flex-col items-end justify-center w-[40%] sm:w-[35%] md:w-[30%]">
                <p className="text-sm font-medium text-right">
                  {typeof value === 'number' 
                    ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                    : value}
                </p>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium mt-1", badgeColorClass)}
                >
                  {changeText}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogTrigger>
      
      {tradingSymbol && (
        <DialogContent className="sm:max-w-[1000px] w-[95vw] max-h-[90vh] p-0 overflow-hidden">
          <div className="text-white">
            {/* Header section with value and status */}
            <div className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-1">
                    {typeof value === 'number' 
                      ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : value}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Last updated: {new Date().toLocaleString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-3xl ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${isPositive ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {isPositive ? 'Normal' : 'Warning'}
                  </span>
                  <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ml-2">
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Chart area */}
            <div className="h-[580px] border border-border mx-6 mb-6 overflow-hidden">
              {renderChart()}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
