# Market Sidekick - Detailed Implementation Plan

## Project Rule References

Throughout implementation, we'll adhere to the following rule files in `.cursor/rules/`:

- **[clean-code.mdc](/.cursor/rules/clean-code.mdc)** - For overall code structure and readability
- **[codequality.mdc](/.cursor/rules/codequality.mdc)** - For linting and general code quality
- **[linting-quality.mdc](/.cursor/rules/linting-quality.mdc)** - For detailed linting standards
- **[typescript.mdc](/.cursor/rules/typescript.mdc)** - For TypeScript standards and type safety
- **[nextjs.mdc](/.cursor/rules/nextjs.mdc)** - For Next.js best practices with App Router
- **[shadcn-ui.mdc](/.cursor/rules/shadcn-ui.mdc)** - For component library implementation
- **[tailwindcss.mdc](/.cursor/rules/tailwindcss.mdc)** - For styling best practices
- **[local-storage.mdc](/.cursor/rules/local-storage.mdc)** - For client-side data persistence
- **[vercel-ai-sdk.mdc](/.cursor/rules/vercel-ai-sdk.mdc)** - For AI integration

## Application Structure

### Pages
1. **Market Crash Dashboard** (`app/page.tsx`) - Home screen
2. **Watchlist** (`app/watchlist/page.tsx`) - Track long-term stocks
3. **Stock Detail** (`app/stocks/[symbol]/page.tsx`) - Individual stock view
4. **Reflection Tool** (`app/reflection/[action]/[symbol]/page.tsx`) - Trading decision reflection
5. **Settings** (`app/settings/page.tsx`) - User preferences

### Shared Components
1. **Layout** (`app/layout.tsx`) - Main app layout with navigation
2. **Header** (`components/header.tsx`) - App header with navigation links
3. **Footer** (`components/footer.tsx`) - App footer with links and information
4. **Navigation** (`components/navigation.tsx`) - Navigation menu/bar

## Page Details

### 1. Market Crash Dashboard (`app/page.tsx`)
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [shadcn-ui.mdc](/.cursor/rules/shadcn-ui.mdc), [tailwindcss.mdc](/.cursor/rules/tailwindcss.mdc)*

The home screen displaying key market indicators with AI-generated explanations.

**Components:**
- `components/dashboard/indicator-card.tsx` - Card displaying each indicator (using shadcn Card component)
- `components/dashboard/ai-explanation.tsx` - AI explanation component (using shadcn Collapsible)
- `components/dashboard/chart-component.tsx` - Chart visualization 
- `components/dashboard/status-badge.tsx` - Visual status indicator (using shadcn Badge)

**Shadcn Components to Install:**
```bash
npx shadcn@latest add card
npx shadcn@latest add collapsible
npx shadcn@latest add badge
```

**Mock Implementation:**
```tsx
// app/page.tsx
import { IndicatorCard } from '@/components/dashboard/indicator-card'
import { DashboardHeader } from '@/components/dashboard/header'

// This is a Server Component - no 'use client' directive needed
export default function DashboardPage() {
  const indicators = [
    {
      id: 'yield-curve',
      name: 'Yield Curve',
      value: '-0.3%',
      status: 'warning',
      explanation: [
        'The yield curve shows interest rates across different loan terms.',
        'An inverted curve (negative value) historically precedes recessions.',
        'Current inversion suggests economic caution in the next 12-18 months.'
      ]
    },
    {
      id: 'vix',
      name: 'VIX (Volatility Index)',
      value: '18.45',
      status: 'normal',
      explanation: [
        'The VIX measures market expectation of future volatility.',
        'Values below 20 generally indicate calm markets.',
        'Current level suggests normal market conditions without excessive fear.'
      ]
    },
    // Other indicators...
  ]

  return (
    <main className="container mx-auto p-4">
      <DashboardHeader title="Market Indicators" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map(indicator => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
    </main>
  )
}
```

**Accessibility Considerations:**
- Follow [linting-quality.mdc](/.cursor/rules/linting-quality.mdc) accessibility guidance

### 2. Watchlist (`app/watchlist/page.tsx`)
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [shadcn-ui.mdc](/.cursor/rules/shadcn-ui.mdc), [typescript.mdc](/.cursor/rules/typescript.mdc)*

Screen showing long-term metrics for stocks the user is tracking.

**Components:**
- `components/watchlist/stock-table.tsx` - Table of tracked stocks (using shadcn Table component)
- `components/watchlist/stock-row.tsx` - Individual stock entry
- `components/watchlist/metrics-display.tsx` - Visual display of key metrics
- `components/watchlist/add-stock-button.tsx` - UI for adding stocks to watchlist (using shadcn Dialog & Form)

**Shadcn Components to Install:**
```bash
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add button
```

**Mock Implementation:**
```tsx
// app/watchlist/page.tsx
import { StockTable } from '@/components/watchlist/stock-table'
import { AddStockButton } from '@/components/watchlist/add-stock-button'

// This is a Server Component - no 'use client' directive needed
export default function WatchlistPage() {
  // This would be fetched from an API in the real implementation
  const stocks = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 183.25,
      pe: 32.15,
      rsiDaily: 58.4,
      rsiWeekly: 62.7,
      wma200Daily: '+5.3%',
      wma200Weekly: '+8.7%'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 412.86,
      pe: 37.21,
      rsiDaily: 54.2,
      rsiWeekly: 61.5,
      wma200Daily: '+3.8%',
      wma200Weekly: '+10.2%'
    },
    // Other stocks...
  ]

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Watchlist</h1>
        <AddStockButton />
      </div>
      <StockTable stocks={stocks} />
    </div>
  )
}
```

**TypeScript Type Definitions:**
*Following [typescript.mdc](/.cursor/rules/typescript.mdc) guidance for interfaces*
```tsx
// types/stock.ts
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  pe: number;
  rsiDaily: number;
  rsiWeekly: number;
  wma200Daily: string;
  wma200Weekly: string;
}
```

### 3. Stock Detail (`app/stocks/[symbol]/page.tsx`)
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [typescript.mdc](/.cursor/rules/typescript.mdc), [shadcn-ui.mdc](/.cursor/rules/shadcn-ui.mdc)*

Detailed view of an individual stock with comprehensive metrics and analysis.

**Components:**
- `components/stocks/price-chart.tsx` - Price history visualization 
- `components/stocks/metrics-panel.tsx` - Detailed metrics display (using shadcn Card)
- `components/stocks/ai-analysis.tsx` - AI-powered analysis of the stock
- `components/stocks/buy-sell-button.tsx` - Trigger for buy/sell reflection (using shadcn Button)

**Shadcn Components to Install:**
```bash
# Most were installed earlier, add any missing ones
npx shadcn@latest add separator
npx shadcn@latest add tabs
```

**Mock Implementation:**
```tsx
// app/stocks/[symbol]/page.tsx
import { PriceChart } from '@/components/stocks/price-chart'
import { MetricsPanel } from '@/components/stocks/metrics-panel'
import { AiAnalysis } from '@/components/stocks/ai-analysis'
import { BuySellButton } from '@/components/stocks/buy-sell-button'
import { type Stock } from '@/types/stock'

// Server component for data fetching
export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const { symbol } = params
  
  // This would be fetched from an API in the real implementation
  const stockData: Stock & { 
    change: number; 
    changePercent: number;
  } = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 183.25,
    change: 1.25,
    changePercent: 0.69,
    pe: 32.15,
    rsiDaily: 58.4,
    rsiWeekly: 62.7,
    wma200Daily: '+5.3%',
    wma200Weekly: '+8.7%',
    // Additional metrics...
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{stockData.symbol}</h1>
          <p className="text-xl">{stockData.name}</p>
        </div>
        <div className="flex gap-4">
          <BuySellButton action="buy" symbol={symbol} />
          <BuySellButton action="sell" symbol={symbol} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriceChart symbol={symbol} />
        </div>
        <div>
          <MetricsPanel data={stockData} />
        </div>
      </div>
      
      <div className="mt-8">
        <AiAnalysis symbol={symbol} />
      </div>
    </div>
  )
}
```

**Performance Considerations:**
- Follow [codequality.mdc](/.cursor/rules/codequality.mdc) for performance optimizations

### 4. Reflection Tool (`app/reflection/[action]/[symbol]/page.tsx`)
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [shadcn-ui.mdc](/.cursor/rules/shadcn-ui.mdc), [typescript.mdc](/.cursor/rules/typescript.mdc)*

Dialog that appears when making buy/sell decisions to prompt user reflection.

**Components:**
- `components/reflection/reflection-form.tsx` - Form for inputting reflection (using shadcn Form)
- `components/reflection/submission-button.tsx` - Submit button component 
- `components/reflection/decision-summary.tsx` - Summary of the decision being made

**Shadcn Components to Install:**
```bash
# Most were installed earlier, add any missing ones
npx shadcn@latest add textarea
```

**Mock Implementation:**
```tsx
// app/reflection/[action]/[symbol]/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReflectionForm } from '@/components/reflection/reflection-form'
import { DecisionSummary } from '@/components/reflection/decision-summary'

export default function ReflectionPage({ 
  params 
}: { 
  params: { action: 'buy' | 'sell'; symbol: string } 
}) {
  const { action, symbol } = params
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (reflectionText: string) => {
    setIsSubmitting(true)
    
    // In real implementation, save reflection to database
    console.log(`Reflection for ${action} ${symbol}:`, reflectionText)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    router.push(`/stocks/${symbol}?reflected=true`)
  }

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Why do you want to {action} {symbol}?
      </h1>
      
      <DecisionSummary action={action} symbol={symbol} />
      
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <ReflectionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  )
}
```

**Form Validation with Zod:**
*Following [linting-quality.mdc](/.cursor/rules/linting-quality.mdc) for input validation*
```tsx
// components/reflection/reflection-form.tsx
'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'

const formSchema = z.object({
  reflection: z.string().min(10, {
    message: "Reflection must be at least 10 characters long",
  }),
})

type FormValues = z.infer<typeof formSchema>
```

### 5. Settings (`app/settings/page.tsx`)
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [shadcn-ui.mdc](/.cursor/rules/shadcn-ui.mdc), [local-storage.mdc](/.cursor/rules/local-storage.mdc)*

User preferences and application configuration.

**Components:**
- `components/settings/theme-selector.tsx` - UI for selecting theme
- `components/settings/notification-settings.tsx` - Notification configuration
- `components/settings/api-key-manager.tsx` - For managing external API keys
- `components/settings/data-preferences.tsx` - Configure data display preferences

**Shadcn Components to Install:**
```bash
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add alert
```

**Mock Implementation:**
```tsx
// app/settings/page.tsx
'use client'

import { useState } from 'react'
import { ThemeSelector } from '@/components/settings/theme-selector'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { ApiKeyManager } from '@/components/settings/api-key-manager'
import { DataPreferences } from '@/components/settings/data-preferences'

export default function SettingsPage() {
  const [themePreference, setThemePreference] = useState('system')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-8">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">Appearance</h2>
          <ThemeSelector 
            value={themePreference} 
            onChange={setThemePreference} 
          />
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">Notifications</h2>
          <NotificationSettings 
            enabled={notificationsEnabled}
            onEnabledChange={setNotificationsEnabled}
          />
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">API Keys</h2>
          <ApiKeyManager />
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">Data Preferences</h2>
          <DataPreferences />
        </div>
      </div>
    </div>
  )
}
```

**User Preference Storage:**
*Implementation will follow [local-storage.mdc](/.cursor/rules/local-storage.mdc) pattern*

## Shared Components

### Layout (`app/layout.tsx`)
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [tailwindcss.mdc](/.cursor/rules/tailwindcss.mdc)*

The main application layout containing the header, footer, and navigation.

**Mock Implementation:**
```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Market Sidekick',
  description: 'A financial tool for long-term investors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Navigation (`components/navigation.tsx`)
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [tailwindcss.mdc](/.cursor/rules/tailwindcss.mdc), [shadcn-ui.mdc](/.cursor/rules/shadcn-ui.mdc)*

The main navigation for the application using shadcn/ui components.

**Mock Implementation:**
```tsx
// components/navigation.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Watchlist', href: '/watchlist' },
  { name: 'Settings', href: '/settings' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}
```

## Data Fetching and State Management

### API Routes
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [vercel-ai-sdk.mdc](/.cursor/rules/vercel-ai-sdk.mdc)*

1. **Market Indicators API** (`app/api/indicators/route.ts`) - Fetch market crash indicators
2. **Stocks API** (`app/api/stocks/route.ts`) - Fetch stock data for watchlist
3. **Stock Details API** (`app/api/stocks/[symbol]/route.ts`) - Fetch detailed stock data
4. **AI Explanation API** (`app/api/ai/explain/route.ts`) - Generate AI explanations using Vercel AI SDK
5. **Reflection Storage API** (`app/api/reflections/route.ts`) - Store user reflections

**Vercel AI SDK Integration:**
*Following [vercel-ai-sdk.mdc](/.cursor/rules/vercel-ai-sdk.mdc) patterns*
```ts
// app/api/ai/explain/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: Request) {
  const { indicator, data } = await req.json()
  
  const result = streamText({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: 'You are a helpful financial assistant explaining complex market indicators in simple terms.'
      },
      {
        role: 'user',
        content: `Explain the current ${indicator} value of ${data} in 3 bullet points at a 9th-grade reading level.`
      }
    ],
  })
  
  return result.toDataStreamResponse()
}
```

### Client-Side State Management
*Applicable rules: [nextjs.mdc](/.cursor/rules/nextjs.mdc), [clean-code.mdc](/.cursor/rules/clean-code.mdc), [local-storage.mdc](/.cursor/rules/local-storage.mdc)*

We'll use a combination of React Context for app-wide state and local state for component-specific state:

- `contexts/stocks-context.tsx` - Watchlist state management
- `contexts/theme-context.tsx` - Theme preferences 
- `contexts/settings-context.tsx` - User settings

**Local Storage Integration for User Preferences:**
*Following [local-storage.mdc](/.cursor/rules/local-storage.mdc) pattern*
```ts
// hooks/useTheme.ts
'use client'

import { z } from 'zod'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const ThemeSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']),
})

export function useTheme() {
  const [theme, setTheme, resetTheme] = useLocalStorage(
    'theme-settings',
    ThemeSchema,
    { mode: 'system' },
    { prefix: 'app' }
  )
  
  return { theme, setTheme, resetTheme }
}
```

## Implementation Checklist

### Setup Phase
- [ ] Create Next.js project with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Set up shadcn/ui
- [ ] Configure ESLint and Prettier
- [ ] Set up directory structure
- [ ] Create basic layout and components

### Core Development
- [ ] Implement Layout and Navigation
- [ ] Build Market Crash Dashboard
- [ ] Implement Watchlist Screen
- [ ] Create Stock Detail View
- [ ] Build Reflection Tool
- [ ] Implement Settings Page
- [ ] Develop API Routes
- [ ] Connect Data Sources
- [ ] Implement AI Explanations

### Refinement Phase
- [ ] Add Proper Error Handling
- [ ] Implement Loading States
- [ ] Enhance Accessibility
- [ ] Optimize Performance
- [ ] Add Dark Mode
- [ ] Verify Mobile Responsiveness
- [ ] Test Browser Compatibility
- [ ] Fix All Linter Issues

## Testing and Quality Assurance
*Following [linting-quality.mdc](/.cursor/rules/linting-quality.mdc) and [codequality.mdc](/.cursor/rules/codequality.mdc)*

- Run ESLint verification on all code
- Test accessibility with screen readers and keyboard navigation
- Verify responsive design at all breakpoints
- Ensure proper error handling for API failures
- Test dark mode functionality
- Verify React hook dependency arrays are correct

## Next Steps
1. Set up project with Next.js, TypeScript, Tailwind CSS, and shadcn/ui
2. Implement layout and main navigation
3. Build the Market Crash Dashboard (home page)
4. Implement the Watchlist screen
5. Create the Stock Detail page
6. Develop the Reflection Tool
7. Build the Settings page
8. Implement API routes for data fetching
9. Connect AI explanation functionality
10. Add polish, testing, and optimization 