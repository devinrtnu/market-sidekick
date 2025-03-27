'use client'

import { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<
  string,
  {
    label: string
    color: string
  }
>

const ChartConfigContext = createContext<ChartConfig | null>(null)

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <ChartConfigContext.Provider value={config}>
      <div
        className={cn('space-y-3', className)}
        style={
          {
            // Generate CSS variables for chart colors
            ...Object.entries(config).reduce((vars, [key, value]) => {
              return {
                ...vars,
                [`--color-${key}`]: value.color,
              }
            }, {}),
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </ChartConfigContext.Provider>
  )
}

export function useChartConfig() {
  const context = useContext(ChartConfigContext)

  if (!context) {
    throw new Error('useChartConfig must be used within a ChartConfigProvider')
  }

  return context
}

interface ChartTooltipProps {
  content: React.ReactNode
  cursor?: boolean
  className?: string
}

export function ChartTooltip({
  content,
  cursor = true,
  className,
  ...props
}: ChartTooltipProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'content'>) {
  return (
    // @ts-ignore - Recharts typing issue
    <div
      // Setting className and style here has no effect
      // These are for passthrough to the recharts component
      className={className}
      data-cursor={cursor}
      {...props}
    >
      {content}
    </div>
  )
}

interface ChartTooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      date: string
      [key: string]: any
    }
  }>
  label?: string
  hideLabel?: boolean
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  className,
  ...props
}: ChartTooltipContentProps) {
  const config = useChartConfig()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-2 shadow-sm',
        className
      )}
      {...props}
    >
      <div className="grid grid-cols-2 gap-2">
        {!hideLabel && (
          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
          </div>
        )}
        {payload.map((item) => {
          const dataKey = item.name as string
          const itemConfig = config[dataKey]
          return (
            <div key={item.name} className="flex flex-col gap-0.5">
              <span
                className="flex items-center gap-1 text-[0.70rem] uppercase text-muted-foreground"
                style={{ color: itemConfig?.color }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: itemConfig?.color }}
                />
                {itemConfig?.label}
              </span>
              <span className="font-medium tabular-nums">
                {typeof item.value === 'number'
                  ? new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                    }).format(item.value)
                  : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
