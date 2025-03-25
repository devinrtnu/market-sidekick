import type { Metadata } from 'next'
import Image from 'next/image'

// Generate page-specific metadata
export const metadata: Metadata = {
  title: 'SEO Example',
  description: 'Learn how to use the Next.js Metadata API for search engine optimization',
  openGraph: {
    title: 'SEO Example | Spark Foundation',
    description: 'Learn how to use the Next.js Metadata API for search engine optimization',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'SEO Example',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Example | Spark Foundation',
    description: 'Learn how to use the Next.js Metadata API for search engine optimization',
    images: ['/og.png'],
  },
}

export default function SeoExamplePage() {
  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8">SEO Example</h1>
      
      <div className="grid gap-8 mb-12">
        <section className="p-6 border rounded-lg bg-card">
          <h2 className="text-2xl font-semibold mb-4">Page-specific metadata</h2>
          <p className="mb-4">
            This page demonstrates how to configure page-specific SEO metadata using the Next.js Metadata API.
            Check the page source to see the generated meta tags.
          </p>
          <pre className="p-4 bg-muted rounded-md overflow-x-auto">
            <code>{`// Generate page-specific metadata
export const metadata: Metadata = {
  title: 'SEO Example',
  description: 'Learn how to use the Next.js Metadata API',
  openGraph: {
    title: 'SEO Example | Spark Foundation',
    description: 'Learn how to use the Next.js Metadata API',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'SEO Example',
      },
    ],
  },
  // ... additional metadata
}`}</code>
          </pre>
        </section>
        
        <section className="p-6 border rounded-lg bg-card">
          <h2 className="text-2xl font-semibold mb-4">Open Graph Image</h2>
          <p className="mb-4">
            The Open Graph image is used when your page is shared on social media platforms. 
            By default, we use a static image for simplicity and reliability.
          </p>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Preview:</h3>
            <div className="border rounded-md overflow-hidden" style={{ maxWidth: '600px' }}>
              <Image 
                src="/og.png"
                alt="Default OG image"
                width={1200}
                height={630}
                className="w-full h-auto"
              />
              <div className="bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  Static OG image used throughout the site for social sharing
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">When to use dynamic vs. static metadata</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Static metadata</strong>: Use for pages with fixed content like landing pages, about pages, or contact pages.</li>
          <li><strong>Dynamic metadata</strong>: Use for blog posts, product pages, or any content that is generated from a database or CMS.</li>
          <li><strong>generateMetadata</strong>: For dynamic routes, you can use the <code>generateMetadata</code> function to create metadata based on route parameters or external data.</li>
        </ul>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Example with generateMetadata:</h3>
          <pre className="p-4 bg-muted rounded-md overflow-x-auto">
            <code>{`// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
}

// Generate metadata based on route parameters
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Fetch post data
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
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  )
} 