import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Ensure we have valid messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Missing or invalid messages', { status: 400 })
    }

    // Use the AI SDK to stream text from OpenAI
    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      temperature: 0.7,
    })

    // Return the stream response
    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Error in chat API route:', error)
    return new Response('Error processing your request', { status: 500 })
  }
} 