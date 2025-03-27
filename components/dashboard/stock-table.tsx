'use client'; // Needs client interactivity for potential sorting/filtering later

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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define interface for stock data - can be moved to a shared types file later
export interface StockData {
  ticker: string;
  price: number;
  change?: string; // Added optional change for dashboard context
  rsiWeekly?: number; // Made optional as dashboard might not show all
  rsiDaily?: number; // Made optional
  ma200Weekly?: number; // Made optional
  ma200Daily?: number; // Made optional
  starred?: boolean; // Keep for filtering if needed
}

interface StockTableProps {
  stocks: StockData[];
  title?: string;
  description?: string;
  caption?: string;
  showExtendedMetrics?: boolean; // Control whether to show RSI/MA columns
}

// Helper function to determine cell color based on RSI value
function getRSIColorClass(rsi: number | undefined): string {
  if (rsi === undefined) return "text-muted-foreground";
  if (rsi >= 70) return "text-red-500 dark:text-red-400 font-medium";
  if (rsi <= 30) return "text-green-500 dark:text-green-400 font-medium";
  return "text-foreground"; // Use foreground for normal range
}

// Helper function to determine cell background class based on RSI value
function getRSIBgClass(rsi: number | undefined): string {
  if (rsi === undefined) return "";
  if (rsi >= 70) return "bg-red-50 dark:bg-red-950/20 border-l border-red-200 dark:border-red-800";
  if (rsi <= 30) return "bg-green-50 dark:bg-green-950/20 border-l border-green-200 dark:border-green-800";
  return "";
}

// Helper function to determine cell color based on price vs MA
function getMAComparisonClass(price: number | undefined, ma: number | undefined): string {
  if (price === undefined || ma === undefined) return "text-muted-foreground";
  if (price > ma) return "text-green-500 dark:text-green-400 font-medium";
  if (price < ma) return "text-red-500 dark:text-red-400 font-medium";
  return "text-foreground"; // Use foreground if equal or undefined
}

// Helper function for basic change color
function getChangeColorClass(change: string | undefined): string {
  if (!change) return "text-muted-foreground";
  return change.startsWith('+') ? 'text-green-600' : 'text-red-600';
}

export function StockTable({
  stocks,
  title = "Stock Watchlist",
  description = "Key stocks being monitored.",
  caption,
  showExtendedMetrics = false // Default to simpler view for dashboard
}: StockTableProps) {
  
  const hasData = stocks && stocks.length > 0;

  return (
    <Card className="overflow-hidden">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wider font-medium text-muted-foreground">Ticker</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">Price</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">Change</TableHead>
                {showExtendedMetrics && (
                  <>
                    <TableHead className="h-11 px-4 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">RSI (W)</TableHead>
                    <TableHead className="h-11 px-4 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">RSI (D)</TableHead>
                    <TableHead className="h-11 px-4 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">MA200 (W)</TableHead>
                    <TableHead className="h-11 px-4 text-xs uppercase tracking-wider font-medium text-muted-foreground text-right">MA200 (D)</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasData ? (
                stocks.map((stock, index) => (
                  <TableRow key={stock.ticker} className="transition-colors hover:bg-muted/50">
                    <TableCell className="p-3 px-4">
                      <span className="font-medium text-foreground">{stock.ticker}</span>
                    </TableCell>
                    <TableCell className="p-3 px-4 text-right">
                      <span className="font-mono tabular-nums text-foreground">
                        ${stock.price?.toFixed(2) ?? 'N/A'}
                      </span>
                    </TableCell>
                     <TableCell className={`p-3 px-4 text-right font-mono tabular-nums ${getChangeColorClass(stock.change)}`}>
                      {stock.change ?? 'N/A'}
                    </TableCell>
                    {showExtendedMetrics && (
                      <>
                        <TableCell className={`p-3 px-4 text-right font-mono tabular-nums ${getRSIBgClass(stock.rsiWeekly)}`}>
                          <div className={`flex items-center justify-end ${getRSIColorClass(stock.rsiWeekly)}`}>
                            {stock.rsiWeekly?.toFixed(1) ?? 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className={`p-3 px-4 text-right font-mono tabular-nums ${getRSIBgClass(stock.rsiDaily)}`}>
                          <div className={`flex items-center justify-end ${getRSIColorClass(stock.rsiDaily)}`}>
                            {stock.rsiDaily?.toFixed(1) ?? 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="p-3 px-4 text-right font-mono tabular-nums">
                          <div className={`flex items-center justify-end ${getMAComparisonClass(stock.price, stock.ma200Weekly)}`}>
                            ${stock.ma200Weekly?.toFixed(2) ?? 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="p-3 px-4 text-right font-mono tabular-nums">
                          <div className={`flex items-center justify-end ${getMAComparisonClass(stock.price, stock.ma200Daily)}`}>
                            ${stock.ma200Daily?.toFixed(2) ?? 'N/A'}
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showExtendedMetrics ? 7 : 3} className="h-24 text-center text-muted-foreground">
                    No stocks in watchlist.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {caption && hasData && (
              <TableCaption className="px-6 pt-2 pb-4 caption-bottom text-center text-sm text-muted-foreground">
                {caption}
              </TableCaption>
            )}
          </Table>
        </div>
      </CardContent>
      {showExtendedMetrics && hasData && ( 
        <CardFooter className="flex flex-col items-start border-t pt-4">
          <h3 className="font-medium mb-2 text-sm">Indicator Legend:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 bg-green-50 dark:bg-green-950/20 rounded-sm border border-green-200 dark:border-green-800"></span>
              <span><span className="text-green-500 dark:text-green-400 font-medium">Green RSI</span>: Potential oversold (≤ 30)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 bg-red-50 dark:bg-red-950/20 rounded-sm border border-red-200 dark:border-red-800"></span>
              <span><span className="text-red-500 dark:text-red-400 font-medium">Red RSI</span>: Potential overbought (≥ 70)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 rounded-sm border border-green-200 dark:border-green-800"></span>
              {/* Using curly brace escaping for > */}
              <span><span className="text-green-500 dark:text-green-400 font-medium">Green MA</span>: Price {'>'} MA (bullish)</span> 
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 rounded-sm border border-red-200 dark:border-red-800"></span>
              {/* Using curly brace escaping for < */}
              <span><span className="text-red-500 dark:text-red-400 font-medium">Red MA</span>: Price {'<'} MA (bearish)</span> 
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
