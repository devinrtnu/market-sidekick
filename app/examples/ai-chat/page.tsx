'use client'

import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { useEffect, useRef } from 'react'

export default function AIChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className="container mx-auto py-10 px-4 md:py-16 md:px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-8">AI Chat Example</h1>
      <p className="text-base md:text-lg mb-6 md:mb-8">
        This example demonstrates how to implement a chat interface using the Vercel AI SDK and OpenAI.
      </p>
      
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 order-2 md:order-1">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Real-time text streaming</li>
                <li>OpenAI integration</li>
                <li>Responsive UI</li>
                <li>Auto-scroll messages</li>
                <li>Mobile-friendly design</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">To use this example, you need to:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Get an OpenAI API key</li>
                <li>Add it to your .env.local file</li>
                <li>Restart your dev server</li>
              </ol>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3 order-1 md:order-2">
          <Card className="min-h-[500px] md:min-h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Chat with AI</CardTitle>
              <CardDescription>Ask the AI anything and get a helpful response.</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-hidden flex flex-col">
              <div className="space-y-4 overflow-y-auto max-h-[350px] md:max-h-[400px] pb-2 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No messages yet. Start a conversation!</p>
                    <p className="text-sm mt-2">Try asking about:</p>
                    <ul className="text-sm mt-1">
                      <li>• How to implement feature X in Next.js</li>
                      <li>• Best practices for API design</li>
                      <li>• How to optimize for performance</li>
                    </ul>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                            {message.role === 'user' ? 'U' : 'AI'}
                          </div>
                        </Avatar>
                        <div 
                          className={`rounded-lg px-4 py-2 whitespace-pre-wrap ${
                            message.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            <CardFooter className="flex-shrink-0 border-t pt-4">
              <form onSubmit={handleSubmit} className="w-full space-y-2">
                <Textarea
                  placeholder="Type your message here..."
                  value={input}
                  onChange={handleInputChange}
                  className="w-full resize-none max-h-[150px] overflow-y-auto"
                  rows={3}
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? 'Thinking...' : 'Send message'}
                </Button>
              </form>
            </CardFooter>
          </Card>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Note: This is a demo implementation. For production use, consider rate limiting, error handling, and proper authentication.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 