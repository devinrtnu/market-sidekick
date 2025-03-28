'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartComponentProps {
  title: string
  description?: string
}

export function ChartComponent({ title, description }: ChartComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        {/* This is a placeholder for an actual chart library like recharts */}
        <div className="h-[200px] w-full flex items-center justify-center bg-muted rounded-md">
          <div className="text-muted-foreground">Chart Visualization (Placeholder)</div>
        </div>
      </CardContent>
    </Card>
  )
} 