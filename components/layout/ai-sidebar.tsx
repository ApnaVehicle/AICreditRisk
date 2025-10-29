'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, MessageSquare, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EXAMPLE_QUERIES } from '@/lib/agent'
import { useReferences, ReferenceEntity } from '@/lib/context/reference-context'
import { ReferenceAutocomplete } from '@/components/chat/reference-autocomplete'
import { MarkdownMessage } from '@/components/chat/markdown-message'
import { ThinkingIndicator } from '@/components/chat/thinking-indicator'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function AISidebar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // @ Reference autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [atSymbolPosition, setAtSymbolPosition] = useState(-1)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { searchEntities } = useReferences()

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
    setShowSuggestions(false)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/agent/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from server')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let streamedContent = ''
      let newConversationId = conversationId

      if (reader) {
        // Add empty streaming message
        const streamingMessageIndex = messages.length + 1
        setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }])
        setLoading(false)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'id') {
                newConversationId = data.conversation_id
                setConversationId(data.conversation_id)
              } else if (data.type === 'token') {
                streamedContent += data.content
                // Update the streaming message
                setMessages(prev => {
                  const updated = [...prev]
                  updated[streamingMessageIndex] = {
                    role: 'assistant',
                    content: streamedContent,
                    isStreaming: true
                  }
                  return updated
                })
              } else if (data.type === 'done') {
                // Mark streaming as complete
                setMessages(prev => {
                  const updated = [...prev]
                  updated[streamingMessageIndex] = {
                    role: 'assistant',
                    content: streamedContent,
                    isStreaming: false
                  }
                  return updated
                })
              } else if (data.type === 'error') {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[streamingMessageIndex] = {
                    role: 'assistant',
                    content: `Error: ${data.error}`,
                    isStreaming: false
                  }
                  return updated
                })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          isStreaming: false
        },
      ])
      setLoading(false)
    }
  }

  const handleSuggestionClick = (query: string) => {
    setInput(query)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)

    // Detect @ symbol for autocomplete
    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1)
      // Only show autocomplete if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setAtSymbolPosition(lastAtSymbol)
        setAutocompleteQuery(textAfterAt)
        setShowAutocomplete(true)
        setSelectedSuggestionIndex(0)

        // Calculate position for autocomplete dropdown
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setAutocompletePosition({
            top: rect.top - 280, // Position above the input
            left: rect.left
          })
        }
      } else {
        setShowAutocomplete(false)
      }
    } else {
      setShowAutocomplete(false)
    }
  }

  const handleAutocompleteSelect = (entity: ReferenceEntity) => {
    if (atSymbolPosition === -1) return

    // Replace the @query with the selected entity
    const beforeAt = input.substring(0, atSymbolPosition)
    const afterQuery = input.substring(atSymbolPosition + autocompleteQuery.length + 1)
    const newInput = `${beforeAt}@${entity.label}${afterQuery}`

    setInput(newInput)
    setShowAutocomplete(false)
    setAtSymbolPosition(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete) {
      const suggestions = searchEntities(autocompleteQuery)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (suggestions[selectedSuggestionIndex]) {
          handleAutocompleteSelect(suggestions[selectedSuggestionIndex])
        }
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const resetConversation = () => {
    setMessages([])
    setConversationId(null)
    setShowSuggestions(true)
    setInput('')
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-ai">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">Credit Risk Expert</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetConversation}
              className="h-8 w-8"
              title="New conversation"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Welcome!</p>
                    <p className="text-xs text-muted-foreground">
                      I can analyze your loan portfolio, identify risks, and provide insights on credit metrics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {showSuggestions && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Suggested Questions
                  </p>
                  <div className="space-y-2">
                    {EXAMPLE_QUERIES.slice(0, 4).map((query, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleSuggestionClick(query)}
                        className="w-full text-left rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs hover:bg-sidebar-accent transition-colors"
                      >
                        <Sparkles className="h-3 w-3 text-primary mb-1 inline-block" />
                        <span className="ml-2">{query}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  {message.role === 'user' ? (
                    <div className="flex justify-end gap-2">
                      <div className="user-message text-white text-sm max-w-[85%]">
                        {message.content}
                      </div>
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full gradient-ai">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="ai-message text-sm max-w-[85%]">
                        <MarkdownMessage
                          content={message.content}
                          isStreaming={message.isStreaming}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ThinkingIndicator variant="wave" showText={true} />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-3 bg-sidebar relative">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about risks, trends... (Type @ for references)"
                className="w-full resize-none rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                rows={2}
                disabled={loading}
              />
              <ReferenceAutocomplete
                suggestions={searchEntities(autocompleteQuery)}
                selectedIndex={selectedSuggestionIndex}
                position={autocompletePosition}
                onSelect={handleAutocompleteSelect}
                visible={showAutocomplete}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="icon"
              className="self-end h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              <kbd className="rounded border border-sidebar-border px-1 py-0.5 text-[9px]">Enter</kbd> to send
            </p>
            <button
              onClick={() => {
                setInput(input + '@')
                inputRef.current?.focus()
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <AtSign className="h-3 w-3" />
              Add reference
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
