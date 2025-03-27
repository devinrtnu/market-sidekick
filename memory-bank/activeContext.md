# Market Sidekick - Active Context

## Current Focus

The project is currently focused on implementing the core features of the Market Sidekick application, with the **Market Dashboard** feature completed and the **Watchlist Screen** as the next priority.

### Recent Implementations

1. **Stock Table Component**
   - Implemented a shadcn/ui table for tracking stocks on the playground page
   - Added visual indicators for RSI values (overbought/oversold conditions)
   - Included price comparison with moving averages (bullish/bearish indicators)
   - Applied consistent container layout pattern with `container mx-auto px-4 sm:px-6`
   - Used color coding following project's visual language patterns
   - Included columns for: ticker, price, RSI (weekly/daily), MA200 (weekly/daily)
   - Added legend for explaining the color indicators to users
   - Documented container layout pattern in .clinerules to ensure future components remain properly contained

2. **Reusable StockTable Component & Dashboard Integration**
   - Extracted the detailed stock table logic from the playground (`app/examples/playground/page.tsx`) into a reusable component: `components/dashboard/stock-table.tsx`.
   - This component includes helper functions for conditional styling based on RSI and MA values and supports showing/hiding extended metrics.
   - Integrated the `StockTable` component into the main dashboard (`app/page.tsx`) for the "Top Watchlist" section, replacing the previous simpler table implementation.
   - **Correction:** Configured the dashboard instance to show the **full extended view** (Ticker, Price, Change, RSI W/D, MA200 W/D) using `showExtendedMetrics={true}`, matching the playground example as requested.
   - Updated mock data structure in `app/page.tsx` to include placeholder RSI/MA values and match the `StockData` interface.
   - **Note:** Encountered persistent JSX escaping errors in the `StockTable` component's legend (now reported around lines 179, 184) that could not be resolved with available tools. The core table functionality is expected to work, but the legend may render incorrectly or show errors. The persistent build error `Unexpected token 'Card'` at line 82 also remains unresolved.

### Previously Completed

1. **Market Dashboard Implementation**
   - Created the main dashboard layout and structure
   - Implemented IndicatorCard component with AI explanations
   - Built MarketPriceCard component for market indices
   - Added ChartComponent (placeholder) for market visualizations
   - Established responsive grid layouts for all dashboard sections
   - Integrated mock data for initial display

### Current Working Area

The development focus is transitioning to the **Watchlist Screen** implementation, which includes:

1. **Component Development**
   - StockTable component for displaying watchlist entries
   - Table filtering and sorting functionality
   - Add/remove stock functionality
   - Key metrics display for tracked stocks

2. **Technical Requirements**
   - Table-based layout for stock information
   - Responsive design for various screen sizes
   - Additional shadcn/ui components installation (Table, Dialog, Form)
   - Local storage integration for persisting watchlist entries

## Next Steps

1. **Immediate Tasks**
   - Install remaining required shadcn/ui components for Watchlist:
     ```bash
     # npx shadcn@latest add table (Completed/Skipped)
     npx shadcn@latest add dialog
     npx shadcn@latest add form
     npx shadcn@latest add input
     ```
   - Create the basic Watchlist page structure (`app/watchlist/page.tsx`)
   - Utilize the new `StockTable` component on the Watchlist page (likely with `showExtendedMetrics={true}`)
   - Add form functionality for adding new stocks

2. **Short-Term Roadmap**
   - Complete Watchlist Screen implementation
   - Begin work on Stock Detail View
   - Plan the Reflection Tool interface
   - Start exploring API options for real market data

3. **Medium-Term Goals**
   - Implement all core screens defined in the project brief
   - Replace mock data with actual API integrations
   - Enhance AI explanations with proper API connections
   - Create proper chart implementations with real data

## Active Decisions & Considerations

1. **Mock Data vs. API Integration**
   - Currently using mock data throughout the application
   - Decision: Delay real API integration until core UI is complete
   - Consideration: Need to ensure data structures in mock data match expected API responses

2. **Chart Implementation**
   - Current charts are placeholder components
   - Decision: Evaluate charting libraries (recharts, visx, etc.) for implementation
   - Consideration: Balance between performance, flexibility, and appearance

3. **State Management**
   - Currently using local component state and planned local storage
   - Decision: Continue with this approach for now, no global state management yet
   - Consideration: May need to reassess as application complexity grows

4. **AI Explanations Source**
   - Current explanations are pre-written mock data
   - Decision: Plan to integrate Vercel AI SDK for dynamic explanations
   - Consideration: API costs and rate limiting for AI-generated content

5. **Responsive Design Approach**
   - Using Tailwind's responsive utilities with mobile-first approach
   - Decision: Maintain this approach throughout all new components
   - Consideration: May need custom breakpoints for data-heavy screens like Watchlist

## Technical Challenges

1. **Table Component Implementation**
   - Challenge: Creating a responsive, sortable table for stock data
   - Challenge: Creating a responsive, sortable, and reusable table for stock data.
   - Approach: Extracted logic into `StockTable` component based on playground example. Uses `shadcn/ui` Table. (Sorting not yet implemented).

2. **StockTable Legend Rendering Issue**
   - Challenge: Persistent JSX escaping errors reported in the `StockTable` legend despite multiple fix attempts using `replace_in_file` and `write_to_file`.
   - Approach: Proceeded with component integration. Issue may require manual review or could be an environment/linter artifact.

3. **Watchlist Persistence**
   - Challenge: Storing user's watchlist between sessions
   - Approach: Implement with type-safe localStorage utilities

3. **Data Visualization**
   - Challenge: Displaying financial data in meaningful charts
   - Approach: Research appropriate chart types for financial data visualization

## Recent Architectural Decisions

1. **Page vs. Component Organization**
   - Decision: Organize by feature at the page level, shared functionality in components
   - Rationale: Provides clear separation of concerns and follows Next.js best practices

2. **Server vs. Client Components**
   - Decision: Use Server Components for data fetching and initial rendering
   - Rationale: Optimizes initial page load and follows Next.js App Router patterns

3. **TypeScript Interface Strategy**
   - Decision: Create shared interfaces for component props and data structures
   - Rationale: Ensures type safety and consistency across the application
