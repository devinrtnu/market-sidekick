import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// Define interface for stock data
interface StockData {
  ticker: string;
  price: number;
  rsiWeekly: number;
  rsiDaily: number;
  ma200Weekly: number;
  ma200Daily: number;
}

// Mock data for demonstration
const stocks: StockData[] = [
  {
    ticker: "AAPL",
    price: 187.68,
    rsiWeekly: 58.4,
    rsiDaily: 52.7,
    ma200Weekly: 175.30,
    ma200Daily: 182.45,
  },
  {
    ticker: "MSFT",
    price: 425.52,
    rsiWeekly: 62.1,
    rsiDaily: 48.3,
    ma200Weekly: 390.75,
    ma200Daily: 415.22,
  },
  {
    ticker: "GOOGL",
    price: 152.25,
    rsiWeekly: 45.6,
    rsiDaily: 39.8,
    ma200Weekly: 147.80,
    ma200Daily: 150.15,
  },
  {
    ticker: "AMZN",
    price: 182.30,
    rsiWeekly: 72.3,
    rsiDaily: 67.9,
    ma200Weekly: 172.50,
    ma200Daily: 175.85,
  },
  {
    ticker: "TSLA",
    price: 172.63,
    rsiWeekly: 29.7,
    rsiDaily: 32.5,
    ma200Weekly: 185.40,
    ma200Daily: 180.20,
  },
  {
    ticker: "META",
    price: 478.22,
    rsiWeekly: 68.9,
    rsiDaily: 65.2,
    ma200Weekly: 450.70,
    ma200Daily: 465.35,
  },
  {
    ticker: "NFLX",
    price: 610.87,
    rsiWeekly: 55.3,
    rsiDaily: 57.8,
    ma200Weekly: 590.25,
    ma200Daily: 605.50,
  },
];

// Helper function to determine cell color based on RSI value
function getRSIColorClass(rsi: number): string {
  if (rsi >= 70) return "text-red-500 dark:text-red-400 font-medium";
  if (rsi <= 30) return "text-green-500 dark:text-green-400 font-medium";
  return "text-slate-700 dark:text-slate-300";
}

// Helper function to determine cell background class based on RSI value
function getRSIBgClass(rsi: number): string {
  if (rsi >= 70) return "bg-red-50 dark:bg-red-950/20 border-l border-red-200 dark:border-red-800";
  if (rsi <= 30) return "bg-green-50 dark:bg-green-950/20 border-l border-green-200 dark:border-green-800";
  return "";
}

// Helper function to determine cell color based on price vs MA
function getMAComparisonClass(price: number, ma: number): string {
  if (price > ma) return "text-green-500 dark:text-green-400 font-medium";
  if (price < ma) return "text-red-500 dark:text-red-400 font-medium";
  return "text-slate-700 dark:text-slate-300";
}

export default function PlaygroundPage() {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Stock Tracking Table</CardTitle>
          <CardDescription>
            Monitor key technical indicators for long-term investment decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <div className="overflow-x-auto -mx-6 px-6 py-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="h-11 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                    Ticker
                  </TableHead>
                  <TableHead className="h-11 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">
                    Price
                  </TableHead>
                  <TableHead className="h-11 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">
                    RSI Weekly
                  </TableHead>
                  <TableHead className="h-11 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">
                    RSI Daily
                  </TableHead>
                  <TableHead className="h-11 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">
                    MA200 Weekly
                  </TableHead>
                  <TableHead className="h-11 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">
                    MA200 Daily
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock, index) => (
                  <TableRow 
                    key={stock.ticker} 
                    className={`transition-colors hover:bg-muted/50 ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
                  >
                    <TableCell className="p-3">
                      <span className="px-2 py-1 rounded-md bg-muted font-medium text-foreground inline-block min-w-[65px] text-center">
                        {stock.ticker}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <span className="font-mono tabular-nums text-foreground font-medium">
                        ${stock.price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className={`p-3 text-right font-mono tabular-nums ${getRSIBgClass(stock.rsiWeekly)}`}>
                      <div className={`flex items-center justify-end ${getRSIColorClass(stock.rsiWeekly)}`}>
                        {stock.rsiWeekly.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell className={`p-3 text-right font-mono tabular-nums ${getRSIBgClass(stock.rsiDaily)}`}>
                      <div className={`flex items-center justify-end ${getRSIColorClass(stock.rsiDaily)}`}>
                        {stock.rsiDaily.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono tabular-nums">
                      <div className={`flex items-center justify-end ${getMAComparisonClass(stock.price, stock.ma200Weekly)}`}>
                        ${stock.ma200Weekly.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono tabular-nums">
                      <div className={`flex items-center justify-end ${getMAComparisonClass(stock.price, stock.ma200Daily)}`}>
                        ${stock.ma200Daily.toFixed(2)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption className="px-6 pt-2 pb-4 caption-bottom text-center text-sm text-muted-foreground">
                Stock market indicators for long-term investors
              </TableCaption>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start border-t">
          <h3 className="font-medium mb-2 text-sm">Indicator Legend:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 bg-green-50 dark:bg-green-950/20 rounded-sm border border-green-200 dark:border-green-800"></span>
              <span><span className="text-green-500 dark:text-green-400 font-medium">Green RSI</span>: Potential oversold condition (RSI ≤ 30)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 bg-red-50 dark:bg-red-950/20 rounded-sm border border-red-200 dark:border-red-800"></span>
              <span><span className="text-red-500 dark:text-red-400 font-medium">Red RSI</span>: Potential overbought condition (RSI ≥ 70)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 rounded-sm border border-green-200 dark:border-green-800"></span>
              <span><span className="text-green-500 dark:text-green-400 font-medium">Green MA</span>: Price above moving average (bullish)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 rounded-sm border border-red-200 dark:border-red-800"></span>
              <span><span className="text-red-500 dark:text-red-400 font-medium">Red MA</span>: Price below moving average (bearish)</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
