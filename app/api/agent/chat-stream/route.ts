/**
 * POST /api/agent/chat-stream
 *
 * Streaming chat endpoint for conversational AI agent
 * Returns Server-Sent Events (SSE) for progressive response display
 */

import { NextRequest } from 'next/server'
import { runAgent } from '@/lib/agent'
import { v4 as uuidv4 } from 'uuid'
import {
  validateQuestionRelevance,
  shouldRejectQuestion,
  getRejectionMessage,
} from '@/lib/agent/guardrails/keyword-validator'

// In-memory conversation storage
const conversations = new Map<string, Array<{ role: string; content: string }>>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversation_id, chat_history } = body

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message is required and must be a non-empty string',
        }),
        { status: 400 }
      )
    }

    // Validate question relevance
    const validation = validateQuestionRelevance(message)

    // Reject if question is clearly off-topic
    if (shouldRejectQuestion(validation)) {
      const conversationId = conversation_id || uuidv4()

      // For rejected questions, stream the rejection message
      const encoder = new TextEncoder()
      const rejectionMessage = getRejectionMessage()

      const stream = new ReadableStream({
        async start(controller) {
          // Send conversation ID
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'id', conversation_id: conversationId })}\n\n`)
          )

          // Stream rejection message character by character
          for (let i = 0; i < rejectionMessage.length; i++) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', content: rejectionMessage[i] })}\n\n`)
            )
            await new Promise(resolve => setTimeout(resolve, 20))
          }

          // Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', rejected: true })}\n\n`)
          )
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Get or create conversation ID
    const conversationId = conversation_id || uuidv4()

    // Get chat history
    let history: Array<{ role: string; content: string }> = []
    if (chat_history && Array.isArray(chat_history)) {
      history = chat_history
    } else if (conversation_id && conversations.has(conversation_id)) {
      history = conversations.get(conversation_id) || []
    }

    // Create streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'id', conversation_id: conversationId })}\n\n`)
          )

          // Run the agent to get full response
          const result = await runAgent(message, history)

          if (!result.success || !result.output) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: result.error || 'Unknown error' })}\n\n`)
            )
            controller.close()
            return
          }

          const fullResponse = result.output

          // Stream the response character by character
          // We'll stream in small chunks for better UX
          const chunkSize = 3 // Characters per chunk
          for (let i = 0; i < fullResponse.length; i += chunkSize) {
            const chunk = fullResponse.slice(i, i + chunkSize)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`)
            )
            // Small delay to simulate typing effect (adjust for desired speed)
            await new Promise(resolve => setTimeout(resolve, 30))
          }

          // Update conversation history
          const newHistory = [
            ...history,
            { role: 'user', content: message },
            { role: 'assistant', content: fullResponse },
          ]
          conversations.set(conversationId, newHistory.slice(-20))

          // Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          )

          controller.close()
        } catch (error: any) {
          console.error('Streaming error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error in streaming chat endpoint:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
      { status: 500 }
    )
  }
}
