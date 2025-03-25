import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Example implementations of Spark Foundation features',
}

export default function ExamplesPage() {
  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8">Examples</h1>
      <p className="text-lg mb-8">
        Explore various examples of features built into the Spark Foundation template.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link 
          href="/examples/seo" 
          className="block p-6 border rounded-lg hover:bg-muted transition-colors duration-200"
        >
          <h2 className="text-2xl font-semibold mb-2">SEO</h2>
          <p className="text-muted-foreground">
            Learn how to use Next.js Metadata API and static OG images for SEO optimization.
          </p>
        </Link>
        
        <Link 
          href="/examples/local-storage" 
          className="block p-6 border rounded-lg hover:bg-muted transition-colors duration-200"
        >
          <h2 className="text-2xl font-semibold mb-2">Local Storage</h2>
          <p className="text-muted-foreground">
            Explore type-safe local storage utilities with Zod validation for client-side persistence.
          </p>
        </Link>

        <Link 
          href="/examples/ai-chat" 
          className="block p-6 border rounded-lg hover:bg-muted transition-colors duration-200"
        >
          <h2 className="text-2xl font-semibold mb-2">AI Chat</h2>
          <p className="text-muted-foreground">
            Implement an AI-powered chat interface using the Vercel AI SDK and OpenAI integration.
          </p>
        </Link>
      </div>
    </div>
  )
} 