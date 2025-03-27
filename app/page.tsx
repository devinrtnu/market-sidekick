import { DashboardHeader } from '@/components/dashboard/header'
import { IndicatorCard, IndicatorProps } from '@/components/dashboard/indicator-card'
import { MarketPriceCard, MarketPriceProps } from '@/components/dashboard/market-price-card';
import { Separator } from '@/components/ui/separator';
// Removed direct Table imports, now using StockTable component
import { StockTable, StockData } from '@/components/dashboard/stock-table'; 

// This is a Server Component - no 'use client' directive needed
export default function Home() {
  // Market prices data - would be fetched from an API
  const marketPrices: MarketPriceProps[] = [
    {
      id: 'sp500',
      name: 'S&P 500',
      price: '4,783.45',
      change: '+0.32%',
      trend: 'up'
    },
    {
      id: 'bonds',
      name: '10Y Treasury',
      price: '3.95%',
      change: '-0.05%',
      trend: 'down'
    },
    {
      id: 'gold',
      name: 'Gold',
      price: '$2,052.30',
      change: '+0.45%',
      trend: 'up'
    },
    {
      id: 'silver',
      name: 'Silver',
      price: '$23.15',
      change: '+0.28%',
      trend: 'up'
    }
  ]

  // Key market indicators with AI explanations
  const indicators: IndicatorProps[] = [
    {
      id: 'yield-curve',
      name: 'Yield Curve',
      description: '10Y-2Y Treasury Spread', // Added description
      value: '-0.45%',
      status: 'warning',
      change: '-0.05%',
      explanation: [
        "Think of the yield curve like a line that shows interest rates for different loan lengths.",
        "When shorter loans have higher rates than longer ones, the curve is \"inverted\" (negative).",
        "An inverted curve often warns us about possible economic troubles in the next year or two.",
        "Right now, the curve is telling us to be careful about the economy."
      ],
      sparklineData: [
        { name: 't-5', value: -0.30 }, { name: 't-4', value: -0.35 }, { name: 't-3', value: -0.40 }, 
        { name: 't-2', value: -0.42 }, { name: 't-1', value: -0.50 }, { name: 't0', value: -0.45 }
      ]
    },
    {
      id: 'vix',
      name: 'VIX (Fear Index)',
      description: 'Market Volatility Expectation', // Added description
      value: '14.23',
      status: 'normal',
      change: '-0.8',
      explanation: [
        "The VIX is like a fear thermometer for the stock market.",
        "When it's low (below 20), investors are generally calm and confident.",
        "When it's high (above 30), investors are worried and expecting big market moves.",
        "Current levels show investors are pretty relaxed right now."
      ],
      sparklineData: [
        { name: 't-5', value: 15.5 }, { name: 't-4', value: 16.0 }, { name: 't-3', value: 15.0 }, 
        { name: 't-2', value: 14.5 }, { name: 't-1', value: 15.03 }, { name: 't0', value: 14.23 }
      ]
    },
    {
      id: 'put-call',
      name: 'PUT/CALL Ratio',
      description: 'Equity Options Sentiment', // Added description
      value: '0.85',
      status: 'normal',
      change: '+0.03',
      explanation: [
        "The PUT/CALL ratio shows if investors are buying more insurance (puts) or betting on growth (calls).",
        "A ratio above 1.0 means more people are being cautious and buying protection.",
        "A ratio below 0.7 means investors might be too optimistic.",
        "The current level shows a healthy balance between caution and optimism."
      ],
      sparklineData: [
        { name: 't-5', value: 0.80 }, { name: 't-4', value: 0.82 }, { name: 't-3', value: 0.88 }, 
        { name: 't-2', value: 0.84 }, { name: 't-1', value: 0.82 }, { name: 't0', value: 0.85 }
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
      sparklineData: [
        { name: 't-5', value: 31.5 }, { name: 't-4', value: 31.8 }, { name: 't-3', value: 32.0 }, 
        { name: 't-2', value: 32.5 }, { name: 't-1', value: 32.2 }, { name: 't0', value: 32.4 }
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
      sparklineData: [
        { name: 't-5', value: 3.90 }, { name: 't-4', value: 3.88 }, { name: 't-3', value: 3.80 }, 
        { name: 't-2', value: 3.75 }, { name: 't-1', value: 3.73 }, { name: 't0', value: 3.85 }
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
      sparklineData: [ // Example: Rate held steady
        { name: 't-5', value: 5.50 }, { name: 't-4', value: 5.50 }, { name: 't-3', value: 5.50 }, 
        { name: 't-2', value: 5.50 }, { name: 't-1', value: 5.50 }, { name: 't0', value: 5.50 }
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
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="container mx-auto px-4 sm:px-6"> {/* Ensured container class from .clinerules */}
        <DashboardHeader /> {/* Removed title prop */}

        {/* Market Prices Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {marketPrices.map(price => (
            <MarketPriceCard key={price.id} price={price} />
          ))}
        </div>
        
        {/* Market Indicators Section */}
        {/* Separator removed */}
        <h2 className="text-xl font-semibold mb-4 mt-8">Key Market Indicators</h2> {/* Added margin-top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicators.map(indicator => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
        
        {/* Top Watchlist Section - Using StockTable component */}
        {/* Separator removed */}
        <section className="mt-8"> {/* Added margin-top */}
           <h2 className="text-xl font-semibold mb-4">Top Watchlist</h2> {/* Moved heading outside */}
           {/* Using StockTable component */}
            <StockTable
             stocks={starredWatchlist}
             title="" // Explicitly pass empty title
             description="" // Explicitly pass empty description
             showExtendedMetrics={true} // Show full details as per playground
             caption="Displaying starred stocks with weekly/daily RSI and MA200 comparison." // Optional caption
           />
        </section>
      </div>
    </div>
  )
}
