'use client'

import { useState, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { 
  ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, 
  Legend, Bar, Line, ReferenceLine, ResponsiveContainer 
} from 'recharts'
import { PutCallRatioData } from '@/lib/types/indicators'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function PutCallRatioDialog() {
  const [data, setData] = useState<PutCallRatioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('1m')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Use cache busting and period parameters
        const response = await fetch(`/api/indicators/put-call-ratio?period=${period}&_=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching put-call ratio data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [period]) // Re-fetch when period changes
  
  // Handle period change
  const handlePeriodChange = (value: string) => {
    if (value) setPeriod(value);
  }

  // Format data for chart
  const formatChartData = () => {
    if (!data || !data.historical || data.historical.length === 0) {
      return []
    }
    
    // Sort data by date in ascending order for the chart
    const sortedData = [...data.historical]
      .sort((a, b) => a.date - b.date)
      .map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        putCallRatio: item.putCallRatio,
        // Add 20-day average line if available
        avgLine: data.twentyDayAverage || undefined
      }))
    
    return sortedData
  }
  
  // Get badge color based on status
  const getStatusBadge = () => {
    if (!data) return null
    
    switch (data.status) {
      case 'danger':
        return <Badge variant="destructive">Bearish</Badge>
      case 'warning':
        return <Badge variant="warning">Neutral</Badge>
      default:
        return <Badge variant="success">Bullish</Badge>
    }
  }
  
  // Format period label
  const getPeriodLabel = () => {
    switch (period) {
      case '1m': return 'Past Month'
      case '3m': return 'Past 3 Months'
      case '6m': return 'Past 6 Months'
      case '1y': return 'Past Year'
      case '2y': return 'Past 2 Years'
      case 'max': return 'Maximum Available'
      default: return 'Past Month'
    }
  }
  
  if (loading || !data) {
    return <div className="flex items-center justify-center p-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Ratio</h3>
          <div className="flex items-center">
            <span className="text-2xl font-bold">
              {data.totalPutCallRatio !== null ? data.totalPutCallRatio.toFixed(2) : 'N/A'}
            </span>
            <span className="ml-2">{getStatusBadge()}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">20-Day Average</h3>
          <p className="text-2xl font-bold">
            {data.twentyDayAverage !== null ? data.twentyDayAverage.toFixed(2) : 'N/A'}
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Source</h3>
          <p className="font-medium">
            {data.source || 'CBOE via Firecrawl'}
            {data.isApproximateData && <span className="text-yellow-600"> (estimated)</span>}
          </p>
          <p className="text-xs text-gray-500">
            Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
          </p>
          
          {/* Show volumes if available */}
          {(data.putsVolume || data.callsVolume) && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Puts: {data.putsVolume?.toLocaleString() || 'N/A'}</p>
              <p>Calls: {data.callsVolume?.toLocaleString() || 'N/A'}</p>
              <p>Total: {data.totalVolume?.toLocaleString() || 'N/A'}</p>
            </div>
          )}
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Historical Data - {getPeriodLabel()}</h3>
          
          {/* Period selector */}
          <ToggleGroup type="single" value={period} onValueChange={handlePeriodChange} size="sm">
            <ToggleGroupItem value="1m">1M</ToggleGroupItem>
            <ToggleGroupItem value="3m">3M</ToggleGroupItem>
            <ToggleGroupItem value="6m">6M</ToggleGroupItem>
            <ToggleGroupItem value="1y">1Y</ToggleGroupItem>
            <ToggleGroupItem value="2y">2Y</ToggleGroupItem>
            <ToggleGroupItem value="max">Max</ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={formatChartData()}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format date to be more compact
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis domain={[0, 'auto']} />
              <Tooltip />
              <Legend />
              <Bar dataKey="putCallRatio" name="Put/Call Ratio" fill="#8884d8" />
              <Line type="monotone" dataKey="avgLine" name="20-Day Avg" stroke="#ff7300" />
              <ReferenceLine y={1.0} stroke="red" strokeDasharray="3 3" />
              <ReferenceLine y={0.7} stroke="green" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <span className="inline-block w-3 h-3 bg-red-400 mr-1"></span>
            <strong>Red line (1.0):</strong> High put/call ratio threshold - indicates bearish sentiment
          </p>
          <p>
            <span className="inline-block w-3 h-3 bg-green-400 mr-1"></span>
            <strong>Green line (0.7):</strong> Low put/call ratio threshold - indicates bullish sentiment  
          </p>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="font-medium">What is the Put/Call Ratio?</h3>
        <p className="text-sm text-gray-600">
          The Put/Call Ratio measures the volume of put options relative to call options traded on the Chicago Board 
          Options Exchange (CBOE). It's a sentiment indicator showing whether investors are positioning defensively (buying puts) 
          or bullishly (buying calls).
        </p>
        
        <h4 className="font-medium text-sm">Interpretation:</h4>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>
            <strong>High Ratio (&gt;1.0):</strong> More puts than calls, indicating bearish sentiment. 
            Often a contrarian bullish signal.
          </li>
          <li>
            <strong>Low Ratio (&lt;0.7):</strong> More calls than puts, indicating bullish sentiment. 
            Often a contrarian bearish signal.
          </li>
          <li>
            <strong>Extreme Readings:</strong> Values over 1.2 or under 0.5 often mark potential market reversal points.
          </li>
        </ul>
        
        <p className="text-sm text-gray-600">
          As a contrarian indicator, extremely high readings may suggest potential market bottoms as investors become 
          excessively bearish, while extremely low readings may suggest potential market tops as investors become excessively bullish.
        </p>
      </div>
    </div>
  )
} 