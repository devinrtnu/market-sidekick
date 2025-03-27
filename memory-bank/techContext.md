# Market Sidekick - Technical Context

## Technologies Used

### Core Framework and Languages

1. **Next.js 15**
   - App Router architecture
   - React Server Components
   - API Routes
   - Built-in SEO optimization
   - File-based routing

2. **React 19**
   - Server and Client Components
   - Hooks for state management
   - Context API for shared state
   - Suspense for loading states

3. **TypeScript**
   - Static type checking
   - Interface-driven development
   - Type-safe props and state
   - Enhanced code completion and documentation

4. **Tailwind CSS**
   - Utility-first CSS framework
   - Responsive design utilities
   - Dark mode support
   - Custom theme configuration

### UI Components

1. **shadcn/ui**
   - Accessible, customizable components
   - Built on Radix UI primitives
   - Consistent theming and styling
   - Components installed individually
   - Key components in use:
     - Card
     - Badge
     - Separator
     - Tabs
     - ScrollArea
     - Button
     - Dropdown Menu
     - Avatar
     - Textarea
     - Table
     - Sheet

2. **Custom Components**
   - IndicatorCard
   - MarketPriceCard
   - ChartComponent
   - DashboardHeader

### Data Validation and Type Safety

1. **Zod**
   - Runtime schema validation
   - TypeScript integration
   - Used for form validation
   - Client-side data validation

### Client-Side Storage

1. **Local Storage Utilities**
   - Type-safe localStorage wrappers
   - Persistence for user preferences
   - Zod validation for stored data
   - React hooks for easy integration

### Data Visualization

1. **recharts**
   - Installed for creating charts.
   - Currently used for sparkline `AreaChart` in `IndicatorCard`.

2. **Chart Components**
   - Placeholder `ChartComponent` exists.
   - Future plans include:
     - Line charts for price history
     - Area charts for market trends
     - Comparison charts for indicators

### API Integration

1. **Planned Financial APIs**
   - Market data APIs
   - Stock price and metrics APIs
   - Financial news aggregation

2. **Vercel AI SDK**
   - For AI-powered explanations
   - Integration with OpenAI models
   - Streaming response support

## Development Setup

### Required Software

- Node.js 18.17.0 or later
- npm 9.6.0 or later
- Git for version control

### Local Development

1. **Installation**
   ```bash
   npm install
   ```

2. **Development Server**
   ```bash
   npm run dev
   ```

3. **Building for Production**
   ```bash
   npm run build
   ```

4. **Production Server**
   ```bash
   npm run start
   ```

### Code Quality Tools

1. **ESLint**
   - Static code analysis
   - TypeScript integration
   - Next.js specific rules
   - Accessibility checking

2. **Prettier**
   - Code formatting
   - Consistent style enforcement
   - IDE integration

## Technical Constraints

### Performance Constraints

1. **Page Load Performance**
   - Initial page load under 2 seconds
   - Optimized component rendering
   - Efficient data fetching
   - Image optimization

2. **Bundle Size**
   - Minimized JavaScript bundle
   - Code splitting for optimal loading
   - Dynamic imports for large components

### Accessibility Requirements

1. **WCAG 2.1 AA Compliance**
   - Proper semantic HTML
   - Keyboard navigation
   - Screen reader compatibility
   - Sufficient color contrast
   - Focus management

### Browser Compatibility

1. **Modern Browsers**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome for Android)
   - No IE11 support required

### Responsive Design

1. **Device Support**
   - Mobile (320px+)
   - Tablet (768px+)
   - Desktop (1024px+)
   - Large screens (1440px+)

## Dependencies

### Production Dependencies

The project uses several key dependencies:

- **next**: Core framework
- **react** and **react-dom**: UI library
- **typescript**: Type checking
- **tailwindcss**: Styling
- **class-variance-authority**: Component variants
- **clsx** and **tailwind-merge**: Class name utilities
- **lucide-react**: Icon library
- **zod**: Schema validation
- **nuqs**: URL search param management
- **recharts**: Charting library

### Development Dependencies

- **typescript**: TypeScript compiler
- **eslint**: Linting
- **prettier**: Formatting
- **postcss**: CSS processing
- **autoprefixer**: CSS vendor prefixing
- **tailwindcss-animate**: Animation utilities

## Architectural Decisions

### Server vs. Client Components

The application follows these patterns for component types:

1. **Server Components (default)**
   - Pages that primarily display data
   - Components that don't need client-side state
   - SEO-critical content
   - Data fetching components

2. **Client Components (when needed)**
   - Interactive UI elements
   - Components with event handlers
   - Forms and inputs
   - Components that use hooks (useState, useEffect)

### Data Fetching Strategy

1. **Server-Side Data Fetching**
   - Fetch data directly in Server Components
   - Use Next.js data fetching methods
   - Pass data as props to client components

2. **Client-Side Data Fetching**
   - Use only for real-time data or post-user interaction
   - Implement loading states
   - Error handling for failed requests

### State Management

1. **Local Component State**
   - React useState for component-specific state
   - Form state and UI interactions

2. **Shared State**
   - React Context for theme and user preferences
   - Custom hooks for complex state logic

3. **URL State**
   - nuqs for URL search params
   - Route parameters for persistent state

## Current Limitations

1. **Data Sources**
   - Currently using mock data
   - No real-time market data integration yet
   - Placeholder charts instead of real visualizations

2. **User Management**
   - No authentication system
   - No user profiles or personalization
   - Local storage only for preferences

3. **Performance Optimization**
   - Some components may need optimization
   - Image optimization not fully implemented
   - No dedicated caching strategy in place

## Future Technical Considerations

1. **API Integration**
   - Connect to financial data providers
   - Implement caching for API responses
   - Add rate limiting and error handling

2. **Authentication**
   - Add user accounts (if required in future)
   - Secure API routes
   - Implement proper authorization

3. **Enhanced Visualization**
   - Implement interactive charts
   - Add technical analysis visualization
   - Real-time data updates

4. **Mobile Optimization**
   - Potential for PWA implementation
   - Mobile-specific UI improvements
   - Touch-optimized interactions
