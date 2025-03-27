'use client'

import { 
  Card,
  CardContent,
  CardDescription, // Added for description
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from '@/components/ui/separator'
import { BrainCircuit, MoveUpRight, MoveDownLeft, AlertTriangle, CheckCircle, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
// Added Tooltip import
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts' 

export interface IndicatorProps {
  id: string
  name: string
  description?: string // Added description field
  value: string
  status: 'normal' | 'warning' | 'danger' | 'good'
  change?: string
  explanation: string[]
  sparklineData?: { date: string; value: number }[] // Use 'date' instead of 'name'
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'

export function IndicatorCard({ indicator }: { indicator: IndicatorProps }) {
  // Map status to color and label (icon removed from header)
  const statusConfig = {
    good: { color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400', label: 'Good' },
    warning: { color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400', label: 'Warning' },
    danger: { color: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400', label: 'Danger' },
    normal: { color: 'bg-secondary text-secondary-foreground', label: 'Normal' },
  }
  const currentStatus = statusConfig[indicator.status] || statusConfig.normal;

  // Determine if change is positive
  const isChangePositive = indicator.change ? indicator.change.startsWith('+') : undefined;
  const isChangeNegative = indicator.change ? indicator.change.startsWith('-') : undefined;

  // Custom Tooltip Content Renderer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-1">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {label} {/* This should be the date */}
              </span>
              <span className="font-bold text-muted-foreground">
                {payload[0].value} {/* Display the value */}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    // Apply default border in light mode, specific gradient color in dark mode
    <Card className="w-full transition-all duration-300 hover:shadow-lg border border-border dark:border-[var(--gradient-dark)]"> 
      <CardHeader className="flex flex-row items-start justify-between"> {/* Flex row for header */}
        <div className="space-y-1"> {/* Left side: Title & Description */}
          <CardTitle className="text-base font-semibold">{indicator.name}</CardTitle> {/* Adjusted size */}
          {indicator.description && (
            <CardDescription className="text-xs text-muted-foreground">
              {indicator.description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2"> {/* Right side: Ask AI & Badge */}
          {/* Sheet component moved to header - now first */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center text-primary hover:text-primary/100 p-1.5 h-auto text-xs" // Adjusted size/padding
              >
                <BrainCircuit className="h-3 w-2 mr-1" /> {/* Adjusted icon size */}
                Ask AI
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{indicator.name}</SheetTitle>
                <SheetDescription>
                  Understanding this market indicator.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4">
                <h4 className="mb-2 text-sm font-medium text-foreground">What it means:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {indicator.explanation.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground pb-2">{item}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div className="py-4 px-4">
                <h4 className="mb-2 text-sm font-medium text-foreground">AI Insights (based on {indicator.value}):</h4>
                <p className="text-sm text-muted-foreground italic">
                  (AI analysis based on the current value will appear here.)
                </p>
                {/* Placeholder for future AI content */}
              </div>
            </SheetContent>
          </Sheet>
          {/* Badge now second */}
          <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", currentStatus.color)}> {/* Adjusted badge style */}
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2"> {/* Adjusted padding - removed top padding */}
        <div className="space-y-2"> {/* Reduced spacing */}
          <div className="flex flex-col space-y-0"> {/* Reduced spacing */}
            <div className="flex items-baseline gap-2"> {/* Use baseline align */}
              <span className="text-2xl font-bold">{indicator.value}</span> {/* Adjusted size */}
              {indicator.change && (
                <span className={cn(
                  "text-xs font-medium", // Adjusted size
                  isChangePositive ? "text-green-600" : isChangeNegative ? "text-red-600" : "text-muted-foreground"
                )}>
                  {indicator.change}
                </span>
              )}
            </div>
          </div>

          {/* Sparkline Chart */}
          {indicator.sparklineData && indicator.sparklineData.length > 1 && (
            <div className="h-12 w-full pt-2"> {/* Adjusted height and padding */}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={indicator.sparklineData}
                  // Removed margin for tighter fit
                  margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={`gradient-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isChangePositive ? '#10B981' : isChangeNegative ? '#EF4444' : '#6B7280'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={isChangePositive ? '#10B981' : isChangeNegative ? '#EF4444' : '#6B7280'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  {/* Add Tooltip component */}
                  <Tooltip 
                    cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1, strokeDasharray: '3 3' }} 
                    content={<CustomTooltip />} 
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isChangePositive ? '#10B981' : isChangeNegative ? '#EF4444' : '#6B7280'} // Green, Red, Gray
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#gradient-${indicator.id})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {/* Hide axes for sparkline effect, but use date for Tooltip label */}
                  <XAxis dataKey="date" hide /> 
                  <YAxis hide domain={['dataMin - (dataMax-dataMin)*0.2', 'dataMax + (dataMax-dataMin)*0.2']} /> {/* Adjusted domain slightly */}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div> {/* Close the inner div wrapping content */}
      </CardContent> {/* Close CardContent */}
      {/* Removed CardFooter */}
    </Card>
  )
}
