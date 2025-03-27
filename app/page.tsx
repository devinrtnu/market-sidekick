import { DashboardHeader } from '@/components/dashboard/header'
import { IndicatorCard, IndicatorProps } from '@/components/dashboard/indicator-card'
// Removed MarketPriceCard import
import { TopIndicatorCard, TopIndicatorProps } from '@/components/dashboard/top-indicator-card'; // Added TopIndicatorCard import
import { Separator } from '@/components/ui/separator';
// Removed direct Table imports, now using StockTable component
import { StockTable, StockData } from '@/components/dashboard/stock-table';

// Updated helper function to generate sparkline data with different trends
const generateMockSparkline = (
  days = 7,
  startValue = 100,
  volatility = 0.02,
  trend: 'up' | 'down' | 'volatile' | 'flat' = 'volatile' // Added trend parameter
) => {
  const data = [];
  let currentValue = startValue;
  const trendFactor = trend === 'up' ? 0.005 : trend === 'down' ? -0.005 : 0; // Small daily bias for trends

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    let changePercent = 0;
    if (trend === 'flat') {
      changePercent = (2 * volatility * Math.random() - volatility) * 0.5; // Lower volatility for flat
    } else if (trend === 'volatile') {
      changePercent = (2 * volatility * Math.random() - volatility) * 1.5; // Higher volatility
    } else {
      changePercent = trendFactor + (2 * volatility * Math.random() - volatility); // Trend bias + randomness
    }
    currentValue *= (1 + changePercent);
    // Ensure value doesn't go negative for things like yields/prices
    currentValue = Math.max(currentValue, 0);
    data.push({ date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: parseFloat(currentValue.toFixed(2)) });
  }
  // Ensure the last point matches the actual value if it's a number
  if (data.length > 0 && typeof startValue === 'number') {
     // This part is tricky without knowing the *actual* final value passed to the component.
     // For mock data, we'll just use the generated end value.
     // A better approach with real data would fetch historical points ending today.
  }
  return data;
};

// This is a Server Component - no 'use client' directive needed
export default function Home() {
  // Top indicators data - adapted from marketPrices for TopIndicatorCard
  const topIndicators: TopIndicatorProps[] = [
    {
      title: 'S&P 500',
      // description: 'US Large Cap Index', // Removed
      value: 4783.45, // Numeric value
      change: 0.32, // Numeric percentage change
      sparklineData: generateMockSparkline(7, 4750, 0.005, 'up') // Upward trend
    },
    {
      title: '10Y Treasury',
      // description: 'US Gov Bond Yield', // Removed
      value: '3.95%', // Keep as string if it's a yield %
      change: -0.05, // Numeric percentage change
      sparklineData: generateMockSparkline(7, 3.98, 0.01, 'down') // Downward trend
    },
    {
      title: 'Gold',
      // description: 'Spot Price (USD/oz)', // Removed
      value: 2052.30, // Numeric value
      change: 0.45, // Numeric percentage change
      sparklineData: generateMockSparkline(7, 2040, 0.008, 'volatile') // Volatile trend
    },
    {
      id: 'vix-top', // Use a unique ID if needed, or rely on map index
      title: 'VIX', // Adding VIX here as requested
      // description: 'Volatility Index', // Removed
      value: 14.23, // Numeric value
      change: -0.8, // Numeric percentage change (assuming -0.8% change)
      sparklineData: generateMockSparkline(7, 14.5, 0.03, 'flat') // Flat trend
    }
    // Removed Silver to make space for VIX, adjust as needed
  ];


  // Key market indicators with AI explanations (Keep existing indicators array)
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
      // Generated 30 days of mock data ending Mar 27
      sparklineData: [
        { date: 'Feb 26', value: -0.28 }, { date: 'Feb 27', value: -0.29 }, { date: 'Feb 28', value: -0.31 }, 
        { date: 'Mar 1', value: -0.30 }, { date: 'Mar 2', value: -0.32 }, { date: 'Mar 3', value: -0.33 }, 
        { date: 'Mar 4', value: -0.35 }, { date: 'Mar 5', value: -0.34 }, { date: 'Mar 6', value: -0.36 }, 
        { date: 'Mar 7', value: -0.37 }, { date: 'Mar 8', value: -0.39 }, { date: 'Mar 9', value: -0.38 }, 
        { date: 'Mar 10', value: -0.40 }, { date: 'Mar 11', value: -0.41 }, { date: 'Mar 12', value: -0.43 }, 
        { date: 'Mar 13', value: -0.42 }, { date: 'Mar 14', value: -0.44 }, { date: 'Mar 15', value: -0.45 }, 
        { date: 'Mar 16', value: -0.47 }, { date: 'Mar 17', value: -0.46 }, { date: 'Mar 18', value: -0.48 }, 
        { date: 'Mar 19', value: -0.49 }, { date: 'Mar 20', value: -0.51 }, { date: 'Mar 21', value: -0.50 }, 
        { date: 'Mar 22', value: -0.48 }, { date: 'Mar 23', value: -0.47 }, { date: 'Mar 24', value: -0.46 }, 
        { date: 'Mar 25', value: -0.44 }, { date: 'Mar 26', value: -0.46 }, { date: 'Mar 27', value: -0.45 }
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
      id: 'put-call',
      name: 'Put/Call Ratio',
      description: 'Equity Options Sentiment', // Added description
      value: '0.85',
      status: 'normal',
      change: '+0.03',
      explanation: [
        "The Put/Call ratio shows if investors are buying more insurance (puts) or betting on growth (calls).",
        "A ratio above 1.0 means more people are being cautious and buying protection.",
        "A ratio below 0.7 means investors might be too optimistic.",
        "The current level shows a healthy balance between caution and optimism."
      ],
      // Generated 30 days of mock data ending Mar 27
      sparklineData: [
        { date: 'Feb 26', value: 0.88 }, { date: 'Feb 27', value: 0.87 }, { date: 'Feb 28', value: 0.89 }, 
        { date: 'Mar 1', value: 0.90 }, { date: 'Mar 2', value: 0.88 }, { date: 'Mar 3', value: 0.86 }, 
        { date: 'Mar 4', value: 0.85 }, { date: 'Mar 5', value: 0.87 }, { date: 'Mar 6', value: 0.84 }, 
        { date: 'Mar 7', value: 0.83 }, { date: 'Mar 8', value: 0.85 }, { date: 'Mar 9', value: 0.86 }, 
        { date: 'Mar 10', value: 0.82 }, { date: 'Mar 11', value: 0.81 }, { date: 'Mar 12', value: 0.83 }, 
        { date: 'Mar 13', value: 0.84 }, { date: 'Mar 14', value: 0.80 }, { date: 'Mar 15', value: 0.79 }, 
        { date: 'Mar 16', value: 0.81 }, { date: 'Mar 17', value: 0.83 }, { date: 'Mar 18', value: 0.85 }, 
        { date: 'Mar 19', value: 0.86 }, { date: 'Mar 20', value: 0.84 }, { date: 'Mar 21', value: 0.82 }, 
        { date: 'Mar 22', value: 0.80 }, { date: 'Mar 23', value: 0.81 }, { date: 'Mar 24', value: 0.83 }, 
        { date: 'Mar 25', value: 0.84 }, { date: 'Mar 26', value: 0.82 }, { date: 'Mar 27', value: 0.85 }
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
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="container mx-auto px-4 sm:px-6"> {/* Ensured container class from .clinerules */}
        <DashboardHeader /> {/* Removed title prop */}

        {/* Top Indicators Section - Using TopIndicatorCard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {topIndicators.map((indicator, index) => (
            <TopIndicatorCard key={indicator.id || index} {...indicator} />
          ))}
        </div>

        {/* Key Market Indicators Section */}
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
           />
        </section>
      </div>
    </div>
  )
}
