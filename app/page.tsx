import { DashboardHeader } from '@/components/dashboard/header'
import { IndicatorCard, IndicatorProps } from '@/components/dashboard/indicator-card'
import { TopIndicatorCard, TopIndicatorProps } from '@/components/dashboard/top-indicator-card';
import { Separator } from '@/components/ui/separator';
import { StockTable, StockData } from '@/components/dashboard/stock-table';
import { fetchAllTopIndicators } from '@/lib/api/yahoo-finance';
import { fetchYieldCurveData } from '@/lib/api/fred';
import { fetchVixIndicator } from '@/lib/api/vix';
import { ForceFixedPutCallRatioIndicator } from '@/components/dashboard/ForceFixedPutCallRatioIndicator';

// This is a Server Component - no 'use client' directive needed
export default async function Home() {
  // Fetch real-time top indicator data from Yahoo Finance
  let topIndicators: TopIndicatorProps[] = [];
  
  try {
    topIndicators = await fetchAllTopIndicators();
  } catch (error) {
    console.error('Error fetching top indicators:', error);
    // If we hit an error, we'll render with empty data and the components will
    // fall back to their mock data implementations
    topIndicators = [];
  }


  // Fetch yield curve data
  let yieldCurveData;
  try {
    console.log('Dashboard: Fetching yield curve data from database first');
    yieldCurveData = await fetchYieldCurveData('1m', false);
    
    // Log the data for debugging
    console.log('Yield curve data fetched:', {
      lastUpdate: new Date().toISOString(),
      latestDataDate: yieldCurveData.latestDataDate,
      currentSpread: yieldCurveData.spread,
      sparklineDataPoints: yieldCurveData.sparklineData.length,
      allDates: yieldCurveData.sparklineData.map(point => point.date)
    });
    
    // Verify the latest date is included in the sparkline data
    if (yieldCurveData.latestDataDate) {
      const latestFormattedDate = new Date(yieldCurveData.latestDataDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      const hasLatestDate = yieldCurveData.sparklineData.some(point => point.date === latestFormattedDate);
      if (!hasLatestDate) {
        console.error(`⚠️ CRITICAL ERROR: Latest API date (${yieldCurveData.latestDataDate} / ${latestFormattedDate}) is missing in sparkline data!`);
        console.log('Available dates:', yieldCurveData.sparklineData.map(point => point.date).join(', '));
      } else {
        console.log(`✅ Confirmed: Latest API date (${yieldCurveData.latestDataDate} / ${latestFormattedDate}) is correctly included in sparkline data`);
      }
    }
    
    // Ensure we have the latest data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (yieldCurveData.latestDataDate !== yesterdayStr) {
      console.warn(`Yield curve data may not be up to date. Latest date: ${yieldCurveData.latestDataDate}, expected: ${yesterdayStr}`);
    } else {
      console.log(`Successfully fetched the latest yield curve data for ${yesterdayStr}`);
    }
    
    // Ensure sparkline data is available
    if (!yieldCurveData.sparklineData || yieldCurveData.sparklineData.length === 0) {
      console.warn('No sparkline data available for yield curve');
    }
    
  } catch (error) {
    console.error('Error fetching yield curve data:', error);
    // Use null to indicate error state
    yieldCurveData = null;
  }

  // Fetch VIX data
  let vixData;
  try {
    console.log('Dashboard: Fetching VIX data');
    vixData = await fetchVixIndicator();
    
    // Log the data for debugging
    console.log('VIX data fetched:', {
      value: vixData.value,
      status: vixData.status,
      change: vixData.change,
      sparklineDataPoints: vixData.sparklineData?.length || 0
    });
    
    // Ensure sparkline data is available
    if (!vixData.sparklineData || vixData.sparklineData.length === 0) {
      console.warn('No sparkline data available for VIX');
    } else {
      console.log('VIX sparkline data dates:', vixData.sparklineData.map(point => point.date).join(', '));
    }
  } catch (error) {
    console.error('Error fetching VIX data:', error);
    // Use null to indicate error state
    vixData = null;
  }

  // Key market indicators with AI explanations
  const indicators: IndicatorProps[] = [
    {
      id: 'yield-curve',
      name: 'Yield Curve',
      description: '10Y-2Y Treasury Spread',
      value: yieldCurveData ? `${(yieldCurveData.spread * 100).toFixed(2)}%` : 'N/A',
      status: yieldCurveData ? 
        (yieldCurveData.status === 'error' ? 'danger' : yieldCurveData.status as 'normal' | 'warning' | 'danger' | 'good') 
        : 'danger',
      change: yieldCurveData && typeof yieldCurveData.change === 'number' 
        ? `${(yieldCurveData.change * 100).toFixed(2)}%` 
        : 'N/A',
      explanation: [
        "Think of the yield curve like a line that shows interest rates for different loan lengths.",
        "When shorter loans have higher rates than longer ones, the curve is \"inverted\" (negative).",
        "An inverted curve often warns us about possible economic troubles in the next year or two.",
        yieldCurveData && typeof yieldCurveData.spread === 'number' && yieldCurveData.spread < 0 
          ? "Right now, the curve is inverted, suggesting caution about the economy."
          : "Right now, the curve is positive, suggesting normal economic conditions."
      ],
      sparklineData: yieldCurveData?.sparklineData || []
    },
    // Use the fetched VIX data if available, otherwise fall back to the static data
    vixData ? vixData : {
      id: 'vix',
      name: 'VIX (Fear Index)',
      description: 'Market Volatility Expectation',
      value: '14.23',
      status: 'normal',
      change: '-0.8',
      explanation: [
        "The VIX is like a fear thermometer for the stock market.",
        "When it's low (below 20), investors are generally calm and confident.",
        "When it's high (above 30), investors are worried and expecting big market moves.",
        "Current levels show investors are pretty relaxed right now."
      ],
      // Generated 30 days of mock data ending Mar 27
      sparklineData: [
        { date: 'Feb 26', value: 16.5 }, { date: 'Feb 27', value: 16.8 }, { date: 'Feb 28', value: 16.6 }, 
        { date: 'Mar 1', value: 17.0 }, { date: 'Mar 2', value: 16.7 }, { date: 'Mar 3', value: 16.9 }, 
        { date: 'Mar 4', value: 16.5 }, { date: 'Mar 5', value: 16.3 }, { date: 'Mar 6', value: 16.0 }, 
        { date: 'Mar 7', value: 15.8 }, { date: 'Mar 8', value: 16.1 }, { date: 'Mar 9', value: 15.9 }, 
        { date: 'Mar 10', value: 15.6 }, { date: 'Mar 11', value: 15.4 }, { date: 'Mar 12', value: 15.7 }, 
        { date: 'Mar 13', value: 15.5 }, { date: 'Mar 14', value: 15.2 }, { date: 'Mar 15', value: 15.0 }, 
        { date: 'Mar 16', value: 15.3 }, { date: 'Mar 17', value: 15.1 }, { date: 'Mar 18', value: 14.8 }, 
        { date: 'Mar 19', value: 14.6 }, { date: 'Mar 20', value: 14.9 }, { date: 'Mar 21', value: 14.7 }, 
        { date: 'Mar 22', value: 14.4 }, { date: 'Mar 23', value: 14.6 }, { date: 'Mar 24', value: 14.3 }, 
        { date: 'Mar 25', value: 14.1 }, { date: 'Mar 26', value: 14.5 }, { date: 'Mar 27', value: 14.23 }
      ]
    },
    {
      id: 'cape',
      name: 'CAPE Ratio',
      description: 'Shiller PE Ratio (Valuation)', // Added description
      value: '32.4',
      status: 'warning',
      change: '+0.2',
      explanation: [
        "The CAPE ratio helps us see if stocks are expensive or cheap compared to their history.",
        "It looks at company earnings over 10 years to smooth out short-term changes.",
        "The long-term average is around 17, so today's level is quite high.",
        "This suggests stocks might be somewhat expensive right now."
      ],
      // Generated 30 days of mock data ending Mar 27
      sparklineData: [
        { date: 'Feb 26', value: 30.5 }, { date: 'Feb 27', value: 30.7 }, { date: 'Feb 28', value: 30.6 }, 
        { date: 'Mar 1', value: 30.9 }, { date: 'Mar 2', value: 31.1 }, { date: 'Mar 3', value: 31.0 }, 
        { date: 'Mar 4', value: 31.3 }, { date: 'Mar 5', value: 31.5 }, { date: 'Mar 6', value: 31.4 }, 
        { date: 'Mar 7', value: 31.7 }, { date: 'Mar 8', value: 31.9 }, { date: 'Mar 9', value: 31.8 }, 
        { date: 'Mar 10', value: 32.0 }, { date: 'Mar 11', value: 32.2 }, { date: 'Mar 12', value: 32.1 }, 
        { date: 'Mar 13', value: 32.4 }, { date: 'Mar 14', value: 32.6 }, { date: 'Mar 15', value: 32.5 }, 
        { date: 'Mar 16', value: 32.3 }, { date: 'Mar 17', value: 32.1 }, { date: 'Mar 18', value: 32.0 }, 
        { date: 'Mar 19', value: 32.2 }, { date: 'Mar 20', value: 32.4 }, { date: 'Mar 21', value: 32.3 }, 
        { date: 'Mar 22', value: 32.5 }, { date: 'Mar 23', value: 32.6 }, { date: 'Mar 24', value: 32.4 }, 
        { date: 'Mar 25', value: 32.2 }, { date: 'Mar 26', value: 32.3 }, { date: 'Mar 27', value: 32.4 }
      ]
    },
    {
      id: 'credit-spreads',
      name: 'Credit Spreads',
      description: 'High Yield vs Treasury', // Added description
      value: '3.85%',
      status: 'normal',
      change: '+0.12%',
      explanation: [
        "Credit spreads show how much extra interest risky companies pay compared to safe ones.",
        "Wider spreads (higher numbers) mean lenders are worried about getting paid back.",
        "Narrow spreads (lower numbers) mean lenders feel confident about lending.",
        "Current spreads suggest normal lending conditions in the market."
      ],
      // Generated 30 days of mock data ending Mar 27
      sparklineData: [
        { date: 'Feb 26', value: 4.10 }, { date: 'Feb 27', value: 4.08 }, { date: 'Feb 28', value: 4.05 }, 
        { date: 'Mar 1', value: 4.02 }, { date: 'Mar 2', value: 4.00 }, { date: 'Mar 3', value: 3.98 }, 
        { date: 'Mar 4', value: 3.95 }, { date: 'Mar 5', value: 3.93 }, { date: 'Mar 6', value: 3.90 }, 
        { date: 'Mar 7', value: 3.88 }, { date: 'Mar 8', value: 3.85 }, { date: 'Mar 9', value: 3.87 }, 
        { date: 'Mar 10', value: 3.84 }, { date: 'Mar 11', value: 3.82 }, { date: 'Mar 12', value: 3.80 }, 
        { date: 'Mar 13', value: 3.78 }, { date: 'Mar 14', value: 3.75 }, { date: 'Mar 15', value: 3.77 }, 
        { date: 'Mar 16', value: 3.74 }, { date: 'Mar 17', value: 3.72 }, { date: 'Mar 18', value: 3.70 }, 
        { date: 'Mar 19', value: 3.73 }, { date: 'Mar 20', value: 3.76 }, { date: 'Mar 21', value: 3.78 }, 
        { date: 'Mar 22', value: 3.80 }, { date: 'Mar 23', value: 3.82 }, { date: 'Mar 24', value: 3.84 }, 
        { date: 'Mar 25', value: 3.86 }, { date: 'Mar 26', value: 3.83 }, { date: 'Mar 27', value: 3.85 }
      ]
    },
    {
      id: 'fed-rate',
      name: 'Fed Funds Rate',
      description: 'Target Upper Bound', // Added description
      value: '5.50%',
      status: 'warning',
      change: '0.00%',
      explanation: [
        "The Fed Funds Rate is like the basic interest rate that influences all other rates.",
        "When it's high, borrowing money becomes more expensive for everyone.",
        "The Fed raises rates to slow down the economy and control prices.",
        "The current high rate shows the Fed is still fighting to keep prices stable."
      ],
      // Generated 30 days of mock data ending Mar 27 (Rate held steady)
      sparklineData: [ 
        { date: 'Feb 26', value: 5.50 }, { date: 'Feb 27', value: 5.50 }, { date: 'Feb 28', value: 5.50 }, 
        { date: 'Mar 1', value: 5.50 }, { date: 'Mar 2', value: 5.50 }, { date: 'Mar 3', value: 5.50 }, 
        { date: 'Mar 4', value: 5.50 }, { date: 'Mar 5', value: 5.50 }, { date: 'Mar 6', value: 5.50 }, 
        { date: 'Mar 7', value: 5.50 }, { date: 'Mar 8', value: 5.50 }, { date: 'Mar 9', value: 5.50 }, 
        { date: 'Mar 10', value: 5.50 }, { date: 'Mar 11', value: 5.50 }, { date: 'Mar 12', value: 5.50 }, 
        { date: 'Mar 13', value: 5.50 }, { date: 'Mar 14', value: 5.50 }, { date: 'Mar 15', value: 5.50 }, 
        { date: 'Mar 16', value: 5.50 }, { date: 'Mar 17', value: 5.50 }, { date: 'Mar 18', value: 5.50 }, 
        { date: 'Mar 19', value: 5.50 }, { date: 'Mar 20', value: 5.50 }, { date: 'Mar 21', value: 5.50 }, 
        { date: 'Mar 22', value: 5.50 }, { date: 'Mar 23', value: 5.50 }, { date: 'Mar 24', value: 5.50 }, 
        { date: 'Mar 25', value: 5.50 }, { date: 'Mar 26', value: 5.50 }, { date: 'Mar 27', value: 5.50 }
      ]
    }
  ]

  // Mock data for Top Watchlist - adapted for StockData interface
  // Added placeholder RSI/MA values for extended view
  // Replace with actual data source later
  const topWatchlistData: StockData[] = [
    // Data based on playground example, adjust as needed
    { ticker: 'AAPL', price: 187.68, change: '+1.5%', starred: true, rsiWeekly: 58.4, rsiDaily: 52.7, ma200Weekly: 175.30, ma200Daily: 182.45 },
    { ticker: 'MSFT', price: 425.52, change: '-0.2%', starred: true, rsiWeekly: 62.1, rsiDaily: 48.3, ma200Weekly: 390.75, ma200Daily: 415.22 },
    { ticker: 'GOOGL', price: 152.25, change: '+0.8%', starred: true, rsiWeekly: 45.6, rsiDaily: 39.8, ma200Weekly: 147.80, ma200Daily: 150.15 },
    { ticker: 'AMZN', price: 182.30, change: '+2.1%', starred: false, rsiWeekly: 72.3, rsiDaily: 67.9, ma200Weekly: 172.50, ma200Daily: 175.85 }, // Example non-starred
    { ticker: 'TSLA', price: 172.63, change: '-1.1%', starred: true, rsiWeekly: 29.7, rsiDaily: 32.5, ma200Weekly: 185.40, ma200Daily: 180.20 },
  ];

  // Filter for starred items
  const starredWatchlist = topWatchlistData.filter(item => item.starred);


  return (
    <div className="container mx-auto px-4 lg:px-6 xl:px-8 2xl:px-16">
      <div className="space-y-8 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topIndicators.map((indicator, index) => {
            // Add trading symbols based on the title
            let tradingSymbol = "";
            if (indicator.title === "S&P 500") {
              tradingSymbol = "SPY";
            } else if (indicator.title === "10Y Treasury") {
              tradingSymbol = "US10Y";
            } else if (indicator.title === "Gold") {
              tradingSymbol = "GOLD";
            } else if (indicator.title === "Bitcoin") {
              tradingSymbol = "COINBASE:BTCUSD";
            }
            
            return (
              <TopIndicatorCard 
                key={index} 
                {...indicator} 
                tradingSymbol={tradingSymbol} 
              />
            );
          })}
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-semibold">Key Market Indicators</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {indicators.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} />
            ))}
            {/* Client side Put/Call Ratio indicator with accurate data */}
            <ForceFixedPutCallRatioIndicator />
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-semibold">Top Watchlist</h2>
          <StockTable
            stocks={starredWatchlist}
            title=""
            description=""
            showExtendedMetrics={true}
          />
        </div>
      </div>
    </div>
  )
}
