/**
 * POST /api/agent/chat
 *
 * Chat endpoint for conversational AI agent
 * Handles multi-turn conversations with context retention
 *
 * Request Body:
 * {
 *   message: string - User's message
 *   conversation_id?: string - Optional conversation ID for context
 *   chat_history?: Array<{role: string, content: string}> - Previous messages
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/agent'
import { v4 as uuidv4 } from 'uuid'
import {
  validateQuestionRelevance,
  shouldRejectQuestion,
  getRejectionMessage,
} from '@/lib/agent/guardrails/keyword-validator'

// In-memory conversation storage (in production, use Redis or database)
// Map: conversation_id -> chat_history
const conversations = new Map<string, Array<{ role: string; content: string }>>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversation_id, chat_history } = body

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required and must be a non-empty string',
        },
        { status: 400 }
      )
    }

    // Validate question relevance (Guardrails Layer 1: Keyword-based)
    const validation = validateQuestionRelevance(message)

    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔍 Validation Result:', validation)
    }

    // Reject if question is clearly off-topic
    if (shouldRejectQuestion(validation)) {
      const conversationId = conversation_id || uuidv4()

      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 Question rejected:', validation.reason)
      }

      return NextResponse.json({
        success: true,
        data: {
          response: getRejectionMessage(),
          conversation_id: conversationId,
          rejected: true,
          validation,
        },
      })
    }

    // Get or create conversation ID
    const conversationId = conversation_id || uuidv4()

    // Get chat history
    let history: Array<{ role: string; content: string }> = []

    if (chat_history && Array.isArray(chat_history)) {
      // Use provided chat history
      history = chat_history
    } else if (conversation_id && conversations.has(conversation_id)) {
      // Retrieve stored history
      history = conversations.get(conversation_id) || []
    }

    // Log the query (for development)
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🤖 Agent Query:', message)
      console.log('📜 History Length:', history.length)
    }

    // Run the agent
    const startTime = Date.now()
    const result = await runAgent(message, history)
    const endTime = Date.now()

    if (process.env.NODE_ENV === 'development') {
      console.log('⏱️  Response Time:', `${endTime - startTime}ms`)
      console.log('✅ Agent Response:', result.output?.substring(0, 100) + '...')
    }

    // Update conversation history
    const newHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: result.output },
    ]

    // Store updated history (limit to last 20 messages to prevent memory issues)
    conversations.set(conversationId, newHistory.slice(-20))

    // Clean up old conversations (older than 1 hour)
    if (Math.random() < 0.1) {
      // 10% chance to run cleanup
      cleanupOldConversations()
    }

    return NextResponse.json({
      success: result.success,
      data: {
        response: result.output,
        conversation_id: conversationId,
        message_count: newHistory.length,
        response_time_ms: endTime - startTime,
      },
      error: result.error || null,
    })
  } catch (error: any) {
    console.error('Error in chat endpoint:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agent/chat
 *
 * Get conversation history for a specific conversation ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'conversation_id is required',
        },
        { status: 400 }
      )
    }

    const history = conversations.get(conversationId) || []

    return NextResponse.json({
      success: true,
      data: {
        conversation_id: conversationId,
        history,
        message_count: history.length,
      },
    })
  } catch (error) {
    console.error('Error fetching conversation history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversation history',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/agent/chat
 *
 * Clear conversation history for a specific conversation ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'conversation_id is required',
        },
        { status: 400 }
      )
    }

    conversations.delete(conversationId)

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared',
    })
  } catch (error) {
    console.error('Error clearing conversation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear conversation',
      },
      { status: 500 }
    )
  }
}

/**
 * Cleanup conversations older than 1 hour
 */
function cleanupOldConversations() {
  // In a real application, you'd check timestamps
  // For this demo, just limit total conversations
  if (conversations.size > 100) {
    // Keep only the most recent 50
    const entries = Array.from(conversations.entries())
    conversations.clear()
    entries.slice(-50).forEach(([id, history]) => {
      conversations.set(id, history)
    })
  }
}
