'use client'

import { useState, useEffect } from 'react'
import { PutCallRatioData } from '@/lib/types/indicators'
import { IndicatorCard, IndicatorProps } from '@/components/dashboard/indicator-card'
import { getPutCallRatioDescription } from '@/lib/utils/indicator-utils'
import { formatWithSign } from '@/lib/utils/indicator-utils'

export function PutCallRatioIndicator() {
  const [indicator, setIndicator] = useState<IndicatorProps>({
    id: 'put-call-ratio',
    name: 'Put/Call Ratio',
    description: 'CBOE Options Put/Call Ratio',
    value: 'Loading...',
    status: 'normal',
    explanation: [
      'The Put/Call Ratio measures the volume of put options relative to call options.',
      'It reveals whether investors are positioning defensively (buying puts) or bullishly (buying calls).',
      'As a contrarian indicator, high ratios often signal excessive pessimism and potential market bottoms.',
      'Low ratios suggest complacency and can be a potential warning sign.',
    ],
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string>('Never')

  useEffect(() => {
    const isMountedRef = { current: true }
    
    async function fetchData() {
      if (!isMountedRef.current) return
      
      try {
        setLoading(true)
        
        // Hard-code timestamp to avoid caching
        const timestamp = Date.now()
        console.log(`[PutCallRatio] Fetching data at ${new Date(timestamp).toISOString()}`)
        
        // Add cache-busting query parameter to force a fresh fetch
        const response = await fetch(`/api/indicators/put-call-ratio?no-cache=${timestamp}`, {
          method: 'GET', // Explicitly set method
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        
        const text = await response.text()
        console.log('[PutCallRatio] Raw response:', text)
        
        // Try to parse the JSON
        let data: PutCallRatioData;
        try {
          data = JSON.parse(text) as PutCallRatioData
        } catch (e) {
          console.error('[PutCallRatio] Failed to parse JSON:', e)
          throw new Error('Invalid JSON response')
        }
        
        // Log for debugging
        console.log('[PutCallRatio] Parsed data:', data)
        console.log('[PutCallRatio] Total put/call ratio:', data.totalPutCallRatio)
        
        if (isMountedRef.current && data) {
          // Calculate percentage change from 20-day average
          let changeText: string | undefined = undefined
          
          if (data.totalPutCallRatio !== null && data.twentyDayAverage !== null) {
            const percentChange = ((data.totalPutCallRatio - data.twentyDayAverage) / data.twentyDayAverage) * 100
            changeText = formatWithSign(percentChange) + '%'
          }
          
          // Format historical data for sparkline
          const sparklineData = data.historical?.map(item => ({
            date: new Date(item.date).toLocaleDateString(),
            value: item.putCallRatio
          }))
          
          console.log('[PutCallRatio] Using value for indicator:', 
            data.totalPutCallRatio !== null ? data.totalPutCallRatio.toFixed(2) : 'N/A')
          
          // Update indicator data with explicit value formatting
          const valueStr = data.totalPutCallRatio !== null ? data.totalPutCallRatio.toFixed(2) : 'N/A'
          setIndicator({
            id: 'put-call-ratio',
            name: 'Put/Call Ratio',
            description: data.isApproximateData 
              ? 'CBOE Options Put/Call Ratio (estimated)'
              : 'CBOE Options Put/Call Ratio',
            value: valueStr,
            status: data.status === 'error' ? 'danger' : data.status,
            change: changeText,
            explanation: data.error 
              ? [`Error: ${data.error}`] 
              : getPutCallRatioDescription(data),
            sparklineData
          })
          
          // Force a re-render to ensure the value is displayed
          setTimeout(() => {
            if (isMountedRef.current) {
              console.log('[PutCallRatio] Forcing re-render with value:', valueStr)
              setIndicator(prev => ({...prev}))
            }
          }, 100)
          
          // Update last fetched time
          setLastFetched(new Date().toLocaleTimeString())
        }
      } catch (err) {
        console.error('[PutCallRatio] Error fetching put-call ratio:', err)
        if (isMountedRef.current) {
          setError('Failed to load data')
          setIndicator(prev => ({
            ...prev,
            value: 'Error',
            status: 'danger',
            explanation: ['Failed to load put-call ratio data. Please try again later.']
          }))
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }
    
    // Initial fetch
    fetchData()
    
    // Refresh data every hour
    const interval = setInterval(fetchData, 60 * 60 * 1000)
    
    // Add manual refresh option in dev environment
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore
      window.__refreshPutCallRatio = fetchData
      console.log('[PutCallRatio] You can manually refresh by calling window.__refreshPutCallRatio()')
    }
    
    return () => {
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [])

  return <IndicatorCard indicator={indicator} />
} 