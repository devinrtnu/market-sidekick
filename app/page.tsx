import { DashboardHeader } from '@/components/dashboard/header'
import { IndicatorCard, IndicatorProps } from '@/components/dashboard/indicator-card'
import { MarketPriceCard, MarketPriceProps } from '@/components/dashboard/market-price-card';
import { ChartComponent } from '@/components/dashboard/chart-component'; // Keep for now, might reuse elsewhere
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      value: '-0.45%',
      status: 'warning',
      change: '-0.05%',
      explanation: [
        "Think of the yield curve like a line that shows interest rates for different loan lengths.",
        "When shorter loans have higher rates than longer ones, the curve is \"inverted\" (negative).",
        "An inverted curve often warns us about possible economic troubles in the next year or two.",
        "Right now, the curve is telling us to be careful about the economy."
      ]
    },
    {
      id: 'vix',
      name: 'VIX (Fear Index)',
      value: '14.23',
      status: 'normal',
      change: '-0.8',
      explanation: [
        "The VIX is like a fear thermometer for the stock market.",
        "When it's low (below 20), investors are generally calm and confident.",
        "When it's high (above 30), investors are worried and expecting big market moves.",
        "Current levels show investors are pretty relaxed right now."
      ]
    },
    {
      id: 'put-call',
      name: 'PUT/CALL Ratio',
      value: '0.85',
      status: 'normal',
      change: '+0.03',
      explanation: [
        "The PUT/CALL ratio shows if investors are buying more insurance (puts) or betting on growth (calls).",
        "A ratio above 1.0 means more people are being cautious and buying protection.",
        "A ratio below 0.7 means investors might be too optimistic.",
        "The current level shows a healthy balance between caution and optimism."
      ]
    },
    {
      id: 'cape',
      name: 'CAPE Ratio',
      value: '32.4',
      status: 'warning',
      change: '+0.2',
      explanation: [
        "The CAPE ratio helps us see if stocks are expensive or cheap compared to their history.",
        "It looks at company earnings over 10 years to smooth out short-term changes.",
        "The long-term average is around 17, so today's level is quite high.",
        "This suggests stocks might be somewhat expensive right now."
      ]
    },
    {
      id: 'credit-spreads',
      name: 'Credit Spreads',
      value: '3.85%',
      status: 'normal',
      change: '+0.12%',
      explanation: [
        "Credit spreads show how much extra interest risky companies pay compared to safe ones.",
        "Wider spreads (higher numbers) mean lenders are worried about getting paid back.",
        "Narrow spreads (lower numbers) mean lenders feel confident about lending.",
        "Current spreads suggest normal lending conditions in the market."
      ]
    },
    {
      id: 'fed-rate',
      name: 'Fed Funds Rate',
      value: '5.50%',
      status: 'warning',
      change: '0.00%',
      explanation: [
        "The Fed Funds Rate is like the basic interest rate that influences all other rates.",
        "When it's high, borrowing money becomes more expensive for everyone.",
        "The Fed raises rates to slow down the economy and control prices.",
        "The current high rate shows the Fed is still fighting to keep prices stable."
      ]
    }
  ]

  // Mock data for Top Watchlist - replace with actual data source later
  const topWatchlist = [
    { ticker: 'AAPL', price: '175.20', change: '+1.5%', starred: true },
    { ticker: 'MSFT', price: '420.10', change: '-0.2%', starred: true },
    { ticker: 'GOOGL', price: '150.80', change: '+0.8%', starred: true },
    { ticker: 'AMZN', price: '180.50', change: '+2.1%', starred: false }, // Example of non-starred
    { ticker: 'TSLA', price: '170.60', change: '-1.1%', starred: true },
  ];

  // Filter for starred items (assuming 'starred' property indicates inclusion in Top Watchlist)
  const starredWatchlist = topWatchlist.filter(item => item.starred);


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

        <Separator className="my-8" />
        
        {/* Market Indicators Section */}
        <h2 className="text-xl font-semibold mb-4">Key Market Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicators.map(indicator => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
        
        <Separator className="my-8" />
        
        {/* Top Watchlist Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Top Watchlist</h2>
          <div className="rounded-md border"> {/* Added border for table container */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Ticker</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {starredWatchlist.length > 0 ? (
                  starredWatchlist.map((item) => (
                    <TableRow key={item.ticker}>
                      <TableCell className="font-medium">{item.ticker}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell className={`text-right ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No starred items in your watchlist yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  )
}
