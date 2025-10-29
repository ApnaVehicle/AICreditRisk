'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Sparkles, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { EXAMPLE_QUERIES } from '@/lib/agent'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.response }])
        setConversationId(data.data.conversation_id)
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${data.error || 'Failed to get response from AI agent'}`,
          },
        ])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (query: string) => {
    setInput(query)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">AI Credit Risk Agent</h1>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about your loan portfolio
                </p>
              </div>
            </div>
            <Badge variant="outline" className="h-8 px-4">
              <Sparkles className="mr-2 h-3 w-3" />
              Powered by OpenRouter
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-4xl flex-1">
          {/* Messages Area */}
          <div className="mb-6 flex-1 space-y-6">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <h2 className="mb-2 text-3xl font-bold">
                  Ask Your Credit Risk Agent
                </h2>
                <p className="mb-8 text-center text-muted-foreground">
                  I can help you analyze portfolio risk, identify delinquent loans,
                  <br />
                  and provide insights on sector concentration and geographic exposure.
                </p>

                {/* Example Queries */}
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Example Questions</CardTitle>
                    <CardDescription>Click any question to get started</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {EXAMPLE_QUERIES.slice(0, 6).map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(query)}
                          className="rounded-lg border bg-card p-4 text-left text-sm transition-all hover:bg-accent hover:shadow-sm"
                        >
                          <Sparkles className="mb-2 h-4 w-4 text-blue-500" />
                          {query}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Messages */
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}

                    <div
                      className={`group relative max-w-[80%] rounded-2xl px-6 py-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'border bg-card'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>

                      {message.role === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="absolute -top-2 right-2 hidden rounded-md border bg-background p-1.5 shadow-sm transition-opacity group-hover:block hover:bg-accent"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl border bg-card px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 pt-4">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about high-risk loans, DPD trends, sector exposure..."
                    className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    size="lg"
                    className="self-end"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Press <kbd className="rounded border px-1.5 py-0.5">Enter</kbd> to send,{' '}
                  <kbd className="rounded border px-1.5 py-0.5">Shift + Enter</kbd> for new line
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
