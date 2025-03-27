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

2. **Dashboard Update: Top Watchlist Section**
   - Replaced the "Market Trends" chart section on the main dashboard (`app/page.tsx`) with a "Top Watchlist" table.
   - Used the `shadcn/ui` Table component to display starred watchlist items.
   - Added mock data for the watchlist display (pending actual data integration).
   - Ensured consistent styling and layout according to `.clinerules`.

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
   - Implement the StockTable component
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
   - Approach: Use shadcn/ui Table component with custom sorting hooks

2. **Watchlist Persistence**
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
