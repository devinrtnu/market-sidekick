'use client'; // Mark as a Client Component

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';

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
}

export function TopIndicatorCard({
  id,
  title,
  value,
  change,
  sparklineData = [],
}: TopIndicatorProps) {
  const isPositive = change >= 0;
  const changeText = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
  const changeColorClass = isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
  const badgeColorClass = isPositive ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700';
  const sparklineColor = isPositive ? '#16a34a' : '#dc2626'; // green-600 / red-600

  // Generate a unique ID for the gradient if no id prop is provided
  const gradientId = `colorValue-${id || title.replace(/\s+/g, '-')}`;

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="px-6 flex items-start justify-between">
        {/* Left Section: Title & Sparkline */}
        <div className="flex flex-col w-[55%] sm:w-[60%] md:w-[65%]"> 
          <p className="text-sm font-medium truncate">{title}</p>
          <div className="h-8 w-[80%] sm:w-[85%] md:w-[75%] xl:w-[85%] 2xl:w-full mt-4 overflow-hidden">
            {sparklineData && sparklineData.length > 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sparklineData}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={sparklineColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={sparklineColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${gradientId})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Section: Value & Change */}
        <div className="flex flex-col items-end justify-center w-[40%] sm:w-[35%] md:w-[30%]">
          <p className="text-sm font-medium text-right">
            {typeof value === 'number' ? value.toFixed(2) : value}
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
  );
}
