'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'

export interface IndicatorProps {
  id: string
  name: string
  value: string
  status: 'normal' | 'warning' | 'danger' | 'good'
  change?: string
  explanation: string[]
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'

export function IndicatorCard({ indicator }: { indicator: IndicatorProps }) {
  const [isOpen, setIsOpen] = useState(false)

  // Define status badge color based on status
  const getBadgeVariant = (): BadgeVariant => {
    switch (indicator.status) {
      case 'normal':
        return 'secondary'
      case 'warning':
        return 'warning'
      case 'danger':
        return 'destructive'
      case 'good':
        return 'success'
      default:
        return 'secondary'
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{indicator.name}</CardTitle>
          <Badge variant={getBadgeVariant()}>{indicator.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{indicator.value}</span>
            {indicator.change && (
              <span className={
                indicator.change.startsWith('+') 
                  ? 'text-green-500' 
                  : indicator.change.startsWith('-') 
                    ? 'text-red-500' 
                    : ''
              }>
                {indicator.change}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardFooter className="p-2 pt-0 flex justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-1">
              <Info size={14} />
              <span className="text-sm">Explanation</span>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </CardFooter>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-3 bg-muted/30">
            <ul className="list-disc pl-5 space-y-1">
              {indicator.explanation.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground">{item}</li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
} 