'use client'; // Mark as a Client Component

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  id?: string; // Add optional id property back
  title: string;
  // description?: string; // Removed description prop
  value: number | string;
  change: number; // Percentage change
  sparklineData?: SparklineDataPoint[];
}

export function TopIndicatorCard({
  id, // Destructure id
  title,
  // description, // Removed description prop
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
    <Card>
      {/* Adjusted layout: flex, justify-between, items-start */}
      {/* Reduced vertical padding from p-4 to py-2 px-4 */}
      <CardContent className="px-4 flex items-start justify-between">
        {/* Left Section: Title & Sparkline */}
        <div className="flex flex-col"> {/* Vertical layout for title and sparkline */}
          {/* Removed text-muted-foreground for default color */}
          <p className="text-md font-medium">{title}</p>
          {/* Sparkline below title */}
          {/* Increased width from w-24 to w-32 */}
          <div className="h-8 w-40">
            {sparklineData && sparklineData.length > 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sparklineData}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }} // Adjusted margin
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
                    isAnimationActive={false} // Optional: disable animation for performance
                  />
                </AreaChart>
            </ResponsiveContainer>
          )}
          </div> {/* End of sparkline container div */}
        </div> {/* End of left section div */}

        {/* Right Section: Value & Change */}
        <div className="text-right flex-shrink-0">
          <p className="text-md font-medium mb-1">{typeof value === 'number' ? value.toFixed(2) : value}</p>
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", badgeColorClass)}
          >
            {changeText}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
