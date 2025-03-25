# Spark Foundation

A modern, high-performance Next.js starter template for building scalable web applications. Built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Shadcn UI.

## 🚀 Features

- **Next.js 15** with App Router
- **React 19** for enhanced performance
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn UI** for accessible component library
- **TurboPackr** for faster development
- **Zod** for schema validation
- **Vercel AI SDK** for AI features
- **nuqs** for URL search param management
- **Type-safe Local Storage** for client-side persistence
- **Modular architecture** for scalability
- **Advanced SEO** with dynamic OG images

## 📋 Prerequisites

- Node.js 18.17.0 or later
- npm 9.6.0 or later

## 🛠️ Getting Started

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/spark-foundation.git
cd spark-foundation
```

### Step 2: Reset Git repository

After cloning, you'll want to remove the existing Git history so you can start fresh with your own repository:

```bash
# Remove the existing Git repository
rm -rf .git

# Initialize a new Git repository
git init

# Add all files to the new repository
git add .

# Create an initial commit
git commit -m "Initial commit"
```

### Step 3: Link to your own repository (optional)

To connect this project to your own GitHub repository:

```bash
# Add your repository as the origin
git remote add origin https://github.com/your-username/your-repo-name.git

# Push to your repository
git push -u origin main
```

### Step 4: Install dependencies

```bash
npm install
```

### Step 5: Set up environment variables

Copy the environment template:

```bash
cp .env.local.template .env.local
```

Edit `.env.local` and configure the necessary variables:

```
# Required - Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional - Uncomment and configure based on your requirements
# Supabase, Stripe, authentication, etc.
```

### Step 6: Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see your application.

## 📁 Project Structure

```
spark-foundation/
├── .cursor/               # Cursor IDE rules for code standards
├── app/                   # Next.js app directory (App Router)
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── api/               # API routes
│   │   └── og/            # Dynamic OG image generation
│   └── examples/          # Example implementations
│       └── seo/           # SEO implementation examples
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── prompts/               # Prompt engineering helpers
├── public/                # Static assets
├── .env.local.template    # Environment variables template
├── components.json        # Shadcn UI configuration
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## 🧩 Available Integrations

The project is designed for easy integration with:

> **💡 PRO TIP**: When using Cursor's AI assistant for any integration, always include the `@Web` command in your prompts (e.g., `@Web Please help me...`). This allows the AI to search the latest documentation and provide up-to-date implementation guidance.

### Supabase

For database, authentication, and storage:

#### Environment Setup

Uncomment the Supabase section in `.env.local` and configure:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key  # Optional, for admin operations
```

#### Integration with AI Assistant

This project includes a custom Supabase integration rule document that helps our AI assistant implement Supabase features correctly. To integrate Supabase using the AI assistant:

> **⚠️ IMPORTANT**: Always include the `@Web` command in your prompts when working with Cursor's AI assistant for integration tasks. This ensures the AI can access the latest documentation and up-to-date information directly from the web, which is crucial for implementing current best practices.

1. **Add Supabase rules to Cursor**:
   - Open Cursor Settings (⚙️) > Features
   - Under "Documentation", click "Add new doc"
   - Name it "Supabase" 
   - Enter the URL `https://supabase.com/docs` in the URL field
   - Click "Add" to let Cursor scrape the Supabase documentation
   - This makes Supabase documentation available via the `@supabase` reference in your prompts

2. **Create a Supabase project** at [https://supabase.com](https://supabase.com) if you haven't already
3. **Copy your Supabase project URL and anon key** from the API settings page
4. **Open Cursor and start a new conversation**

5. **Use the following prompt**:

```
Please help me implement Supabase integration with this Next.js 15 project. I need:

1. Server-side authentication setup with Supabase
2. Connection to Supabase database
3. Middleware for session management
4. Auth callback handler
5. Auth utility functions for both client and server components
6. Basic login, signup, and logout functionality using shadcn/ui components

My Supabase project details:
- Project URL: [Your Supabase Project URL]
- Anon Key: [Your Supabase Anon Key]
```

5. **Attach these files to your conversation**:
   - `package.json` to see existing dependencies
   - `.env.local` if you have already set it up
   - `app/layout.tsx` for context about your app structure
   - `supabase.mdc` (rules file) found in your project's rules directory

6. **Important**: Add these commands to your prompt:
   - Add `@Web` in your prompt to ensure the assistant can access the latest Supabase documentation
   - Add `@supabase` to reference the Supabase rules documentation
   - Example prompt with commands: `@Web @supabase Please help me implement Supabase integration...`

#### Official Documentation

For more detailed information on working with Supabase, refer to these resources:

- [Supabase Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Supabase Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

#### Security Best Practices

When implementing Supabase:

- Always use Row Level Security (RLS) policies to protect your data
- Never expose your service role key in client-side code
- Implement proper input validation before inserting data
- Use TypeScript types generated from your database schema for type safety
- Test authentication flows thoroughly before deployment

### Stripe

For payment processing and subscription management. Uncomment the Stripe section in `.env.local` and configure:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_your-stripe-price-id
```

### Vercel AI SDK

For AI feature integration. Uncomment the relevant AI provider section in `.env.local` and configure:

```
OPENAI_API_KEY=sk-your-openai-api-key
```

### Local Storage Utilities

For client-side persistence without a backend database. The project includes:

- Type-safe localStorage wrappers with Zod validation
- React hooks for easy integration with components
- Collection management for CRUD operations

Check out the example at `/examples/local-storage` to see it in action.

#### Using the hooks:

```tsx
// 1. Define your data schema with Zod
const UserPrefsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  fontSize: z.number().min(10).max(24),
  notifications: z.boolean()
});

type UserPrefs = z.infer<typeof UserPrefsSchema>;

// 2. Use the hook in your component
function SettingsComponent() {
  const [prefs, setPrefs, resetPrefs] = useLocalStorage<UserPrefs>(
    'user-preferences',
    UserPrefsSchema,
    { theme: 'system', fontSize: 16, notifications: true },
    { prefix: 'app' }
  );

  // Now you can use prefs, setPrefs, and resetPrefs in your component
  // The data will persist across page refreshes and browser sessions
}
```

### SEO Optimization

The project includes built-in SEO optimization using Next.js Metadata API:

- Global metadata configuration in `app/layout.tsx`
- Example implementation at `/examples/seo`
- Static OG images for social sharing

#### Configuring page-specific SEO:

```tsx
// app/your-page/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Page Title',
  description: 'Your page description',
  openGraph: {
    title: 'Your Page Title',
    description: 'Your page description',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Your Page Title',
      },
    ],
  },
}
```

#### Dynamic metadata for route parameters:

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Fetch data based on slug
  const post = await getPostBySlug(params.slug)
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: '/og.png', // Use static OG image
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  }
}
```

## 🖥️ Development Tools

### Cursor Rules

This project includes Cursor IDE rules for consistent code quality. The rules enforce standards for:

- Clean code practices
- TypeScript usage
- Next.js best practices
- Tailwind CSS organization
- Component architecture
- Performance optimization
- Security practices

To use these rules with Cursor IDE, ensure the `.cursor` directory is present in your project root.

### Shadcn UI Components

**IMPORTANT NOTE**: For optimal development experience, index the ShadCN documentation in Cursor. When requesting any ShadCN component implementation, always reference this documentation at the start of your request for accurate guidance and best practices.

To add new Shadcn UI components, use:

```bash
npx shadcn@latest add [component-name]
```

For example, to add a button component:

```bash
npx shadcn@latest add button
```

## 📦 Dependencies

### Core
- Next.js 15.2.3
- React 19.0.0
- TypeScript 5+

### UI Components
- Shadcn UI (via components.json)
- Tailwind CSS 4
- Lucide React for icons
- Class Variance Authority for component variants

### Data & State Management
- Zod for schema validation
- nuqs for URL search parameter state management

### Storage
- Type-safe localStorage utilities with Zod validation

### SEO
- Next.js Metadata API for SEO optimization

### AI Features
- Vercel AI SDK for AI integrations

### Utilities
- clsx and tailwind-merge for conditional class names
- tailwindcss-animate for animations

## 🧪 Scripts

- `npm run dev` - Start the development server (with TurboPackr)
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## 🔒 Security Best Practices

- Never commit `.env.local` to version control
- Rotate API keys regularly
- Keep dependencies updated
- Implement proper authentication and authorization
- Validate and sanitize all user inputs

## 🌐 Deployment

The project is optimized for deployment on Vercel:

```bash
npm run build
```

## 📚 Further Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Zod Documentation](https://zod.dev)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [nuqs Documentation](https://github.com/47ng/nuqs)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

## 📄 License

This project is licensed under the MIT License.