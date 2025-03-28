'use client'

import { Card } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MarketPriceProps {
  id: string
  name: string
  price: string
  change: string
  trend: 'up' | 'down'
}

interface Props {
  price: MarketPriceProps
}

export function MarketPriceCard({ price }: Props) {
  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">
          {price.name}
        </h3>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold">
            {price.price}
          </p>
          <div className={cn(
            "flex items-center text-sm",
            price.trend === 'up' ? 'text-green-500' : 'text-red-500'
          )}>
            {price.trend === 'up' ? (
              <ArrowUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1" />
            )}
            <span>{price.change}</span>
          </div>
        </div>
      </div>
    </Card>
  )
} 