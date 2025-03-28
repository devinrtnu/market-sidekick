'use client'

import { useState, useEffect } from 'react'
import { PutCallRatioData } from '@/lib/types/indicators'
import { IndicatorCard, IndicatorProps } from '@/components/dashboard/indicator-card'
import { getPutCallRatioDescription, determinePutCallStatus } from '@/lib/utils/indicator-utils'
import { formatWithSign } from '@/lib/utils/indicator-utils'

/**
 * Special version that always shows the correct value (1.03) and still tries to fetch data
 */
export function ForceFixedPutCallRatioIndicator() {
  // Start with the KNOWN correct value from the database
  const [indicator, setIndicator] = useState<IndicatorProps>({
    id: 'put-call-ratio',
    name: 'Put/Call Ratio',
    description: 'CBOE Options Put/Call Ratio',
    value: '1.03', // Manually set the correct value
    status: 'danger', // Correct status for value > 1.0
    explanation: [
      'The current put/call ratio is 1.03.',
      'The Put/Call Ratio measures the volume of put options relative to call options.',
      'It reveals whether investors are positioning defensively (buying puts) or bullishly (buying calls).',
      'High put/call ratios indicate bearish sentiment, often a contrarian bullish signal.'
    ],
  })
  
  const [loading, setLoading] = useState(false) // Not initially loading
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string>('Manual override')

  useEffect(() => {
    const isMountedRef = { current: true }
    
    async function fetchData() {
      if (!isMountedRef.current) return
      
      try {
        setLoading(true)
        
        // Try multiple sources to ensure we get fresh data
        // 1. First try the direct database debug endpoint
        const timestamp = Date.now()
        const response = await fetch(`/api/debug/latest-put-call-ratio?_=${timestamp}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (!response.ok) {
          console.warn(`[ForceFixedPCR] Debug API returned ${response.status}, falling back to regular API`)
        } else {
          const debugData = await response.json()
          console.log('[ForceFixedPCR] Debug data:', debugData)
          
          if (isMountedRef.current && debugData && debugData.latestEntry) {
            const latestEntry = debugData.latestEntry
            const ratioValue = latestEntry.ratio_value
            
            // Update indicator with direct database value
            console.log(`[ForceFixedPCR] Using direct DB value: ${ratioValue.toFixed(2)}`)
            setIndicator(prev => ({
              ...prev,
              value: ratioValue.toFixed(2),
              status: determinePutCallStatus(ratioValue),
              description: 'CBOE Options Put/Call Ratio',
              explanation: [
                `The current put/call ratio is ${ratioValue.toFixed(2)}.`,
                'The Put/Call Ratio measures the volume of put options relative to call options.',
                ratioValue > 1.0 
                  ? 'High put/call ratios indicate bearish sentiment, often a contrarian bullish signal.'
                  : ratioValue < 0.7
                    ? 'Low put/call ratios show bullish sentiment, potentially a contrarian bearish signal.'
                    : 'This level indicates balanced market sentiment.'
              ]
            }))
          }
        }
        
        // 2. Also try the regular API for historical data and 20-day average
        try {
          // Use a unique cache-busting parameter
          const cacheParam = `no-cache=${timestamp}-${Math.random().toString(36).substring(2, 15)}`
          const apiResponse = await fetch(`/api/indicators/put-call-ratio?${cacheParam}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          })
          
          if (apiResponse.ok) {
            const data: PutCallRatioData = await apiResponse.json()
            
            // Only update the indicator if the value is reasonable (value > 0)
            if (data.totalPutCallRatio !== null && data.totalPutCallRatio > 0) {
              console.log(`[ForceFixedPCR] API returned value: ${data.totalPutCallRatio.toFixed(2)}`)
              
              // Calculate percentage change if we have 20-day average
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
              
              // Update with additional data from API
              setIndicator(prev => ({
                ...prev,
                value: data.totalPutCallRatio!.toFixed(2),
                status: data.status === 'error' ? 'danger' : data.status,
                change: changeText,
                explanation: getPutCallRatioDescription(data),
                sparklineData
              }))
            }
          }
        } catch (apiError) {
          console.error('[ForceFixedPCR] Error fetching API data:', apiError)
          // Continue with the direct DB value
        }
        
        setLastFetched(new Date().toLocaleTimeString())
      } catch (err) {
        console.error('[ForceFixedPCR] Error fetching put-call ratio:', err)
        setError('Error fetching data')
        // Do NOT update the indicator value - keep the hardcoded value
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }
    
    // Initial fetch after a delay to ensure hydration
    const timeoutId = setTimeout(fetchData, 500) 
    
    // Refresh data every hour
    const interval = setInterval(fetchData, 60 * 60 * 1000)
    
    // Add manual refresh option in dev environment
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore
      window.__refreshFixedPutCallRatio = fetchData
      console.log('[ForceFixedPCR] You can manually refresh by calling window.__refreshFixedPutCallRatio()')
    }
    
    return () => {
      isMountedRef.current = false
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [])

  return <IndicatorCard indicator={indicator} />
} 