'use client'

import { 
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { useState } from 'react'
import { YieldCurveDialog } from '@/components/dialogs/indicators/YieldCurveDialog'

export interface IndicatorProps {
  id: string
  name: string
  description?: string
  value: string
  status: 'normal' | 'warning' | 'danger' | 'good'
  change?: string
  explanation: string[]
  sparklineData?: { date: string; value: number }[]
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'

export function IndicatorCard({ indicator }: { indicator: IndicatorProps }) {
  // State to track hover on title area
  const [isHovering, setIsHovering] = useState(false);
  
  // Map status to color and label
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
                {label}
              </span>
              <span className="font-bold text-muted-foreground">
                {payload[0].value}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog>
      <Card className={cn(
        "w-full transition-all duration-300 border border-border dark:border-[var(--gradient-dark)]",
        isHovering && "shadow-2xl border-white/50 dark:border-white/30 -translate-y-1"
      )}>
        <CardHeader className="flex flex-row items-start justify-between">
          {/* The DialogTrigger only applies to the title area */}
          <DialogTrigger asChild>
            <div 
              className="space-y-1 cursor-pointer rounded-md p-1 -m-1"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <CardTitle className="text-base font-semibold">{indicator.name}</CardTitle>
              {indicator.description && (
                <CardDescription className="text-xs text-muted-foreground">
                  {indicator.description}
                </CardDescription>
              )}
            </div>
          </DialogTrigger>
          
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-primary hover:text-primary/100 p-1.5 h-auto text-xs"
                >
                  <BrainCircuit className="h-3 w-3" />
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
                </div>
              </SheetContent>
            </Sheet>
            
            <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", currentStatus.color)}>
              {currentStatus.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 pb-0">
          <div className="space-y-2">
            <div className="flex flex-col space-y-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{indicator.value}</span>
                {indicator.change && (
                  <span className={cn(
                    "text-xs font-medium",
                    isChangePositive ? "text-green-600" : isChangeNegative ? "text-red-600" : "text-muted-foreground"
                  )}>
                    {indicator.change}
                  </span>
                )}
              </div>
            </div>

            {/* Sparkline Chart */}
            {indicator.sparklineData && indicator.sparklineData.length > 1 && (
              <div className="h-12 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={indicator.sparklineData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id={`gradient-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isChangePositive ? '#10B981' : isChangeNegative ? '#EF4444' : '#6B7280'} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={isChangePositive ? '#10B981' : isChangeNegative ? '#EF4444' : '#6B7280'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1, strokeDasharray: '3 3' }} 
                      content={<CustomTooltip />} 
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={isChangePositive ? '#10B981' : isChangeNegative ? '#EF4444' : '#6B7280'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#gradient-${indicator.id})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <XAxis dataKey="date" hide /> 
                    <YAxis hide domain={['dataMin - (dataMax-dataMin)*0.2', 'dataMax + (dataMax-dataMin)*0.2']} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{indicator.name}</DialogTitle>
          <DialogDescription>
            Detailed information and analysis about this market indicator
          </DialogDescription>
        </DialogHeader>
        {indicator.name === "Yield Curve" ? (
          <YieldCurveDialog />
        ) : (
          <p>Details for {indicator.name} will be available soon.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
