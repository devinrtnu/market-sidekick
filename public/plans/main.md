# Market Sidekick for Longterm Investors


### Core Purpose

A user-friendly financial tool that allows both novice and experienced investors to monitor market indicators and personal holdings, with integrated AI assistance to interpret complex financial data. The app is designed to be accessible to laypeople while providing meaningful market insights.

### Key Features

1. Dashboard interface displaying key market indicators (S&P 500, bonds, gold, silver) alongside top user holdings and starred investments
2. Complete ticker list with detailed views for individual stocks
3. AI-powered data interpretation to translate complex market data into understandable insights
4. Flexible AI interaction options (contextual explanations, sidebar assistant, or other user interface elements)
5. Open-source architecture with optional self-hosting capabilities and custom API key integration


**Minimum Viable Features:**

- Stock tracker focused specifically on long-term metrics (Symbol, Price, P/E, RSI Daily/Weekly, WMA-200 Daily/Weekly) for stocks I want to hold long-term.
- Market crash dashboard with key indicators (Yield Curve, VIX, PUT/CALL, CAPE Ratio, Credit Spreads, Fed Funds Rate) each with AI-generated 3-4 bullet explanations at a 9th-grade level.
- Simple reflection tool that makes me articulate why I'm making a trading decision during emotional market periods.

**App Structure:**

- Market Crash Dashboard (home screen) - displays all crash indicators with AI explanations
- Watchlist Screen - shows long-term metrics for stocks I'm tracking
- "Why" Reflection Tool - appears when making buy/sell decisions
- Settings/Profile Screen - for customization and preferences

**Market Crash Dashboard Screen:**

- Components: Card grid layout with each crash indicator in its own Card component; each card contains the indicator visualization (Chart component), current status (Badge component: "Normal", "Warning", "Danger"), and AI explanation (Collapsible component)
- Navigation: Primary tab in bottom navigation bar; Watchlist button in header

**Watchlist Screen:**

- Components: Table component showing stocks with columns for long-term metrics; each row has a Details button that expands to show additional metrics and charts
- Navigation: Tab in bottom navigation; swipe left from Dashboard screen; click on stock to see detailed view

**"Why" Reflection Tool:**

- Components: Dialog component that appears with text input field and Submit button
- Navigation: Triggered when user clicks Buy/Sell button from any stock view