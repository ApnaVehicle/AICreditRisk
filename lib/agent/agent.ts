/**
 * Credit Risk Monitoring AI Agent
 *
 * LangChain agent powered by OpenAI API
 * Provides conversational interface for portfolio monitoring
 */

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { allTools } from './tools'
import { SYSTEM_PROMPT } from './prompts'

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo'

/**
 * Initialize the LLM with OpenAI
 */
function initializeLLM() {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set. Get your API key from https://platform.openai.com/api-keys'
    )
  }

  return new ChatOpenAI({
    model: OPENAI_MODEL,
    apiKey: OPENAI_API_KEY,
    temperature: 0.3, // Lower temperature for more consistent, factual responses
    maxTokens: 2000,
  })
}

/**
 * Run the agent with a user query
 */
export async function runAgent(
  query: string,
  chatHistory: Array<{ role: string; content: string }> = []
) {
  try {
    const llm = initializeLLM()

    // Bind tools to the model
    const modelWithTools = llm.bindTools(allTools)

    // Format chat history
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...chatHistory.map(msg =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(query)
    ]

    // Invoke the model
    const response = await modelWithTools.invoke(messages)

    // Check if model wants to use tools
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Execute tool calls
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall: any) => {
          const tool = allTools.find(t => t.name === toolCall.name)
          if (tool) {
            try {
              // @ts-ignore - LangChain tool invoke has complex union types
              const result = await tool.invoke(toolCall.args)
              return {
                tool: toolCall.name,
                result,
                success: true,
              }
            } catch (error: any) {
              return {
                tool: toolCall.name,
                result: `Error: ${error.message}`,
                success: false,
              }
            }
          }
          return {
            tool: toolCall.name,
            result: 'Tool not found',
            success: false,
          }
        })
      )

      // Create a follow-up message with tool results
      const toolResultsMessage = toolResults
        .map(tr => `Tool ${tr.tool}: ${JSON.stringify(tr.result)}`)
        .join('\n\n')

      // Get final response with tool results
      const finalResponse = await llm.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        ...messages,
        new AIMessage(response.content || 'Using tools...'),
        new SystemMessage(`Tool Results:\n${toolResultsMessage}\n\nPlease provide a clear, concise answer based on these results.`),
      ])

      return {
        output: finalResponse.content as string,
        success: true,
      }
    }

    // No tools needed, return direct response
    return {
      output: response.content as string,
      success: true,
    }
  } catch (error: any) {
    console.error('Error running agent:', error)

    // Provide helpful error messages
    if (error.message?.includes('OPENAI_API_KEY')) {
      return {
        output: 'Error: OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.',
        success: false,
        error: 'MISSING_API_KEY',
      }
    }

    if (error.message?.includes('401') || error.message?.includes('Incorrect API key')) {
      return {
        output: 'Error: Invalid OpenAI API key. Please check your API key at https://platform.openai.com/api-keys',
        success: false,
        error: 'INVALID_API_KEY',
      }
    }

    if (error.message?.includes('429')) {
      return {
        output: 'Error: Rate limit exceeded. Please try again in a moment.',
        success: false,
        error: 'RATE_LIMIT',
      }
    }

    return {
      output: 'I encountered an error processing your request. Please try again or rephrase your question.',
      success: false,
      error: 'AGENT_ERROR',
    }
  }
}

/**
 * Stream agent responses (for future implementation)
 * OpenAI supports streaming, but we'll implement basic non-streaming first
 */
export async function streamAgent(
  query: string,
  chatHistory: Array<{ role: string; content: string }> = []
) {
  // For now, redirect to non-streaming version
  // Can implement streaming in future if needed
  return runAgent(query, chatHistory)
}

/**
 * Legacy export for backwards compatibility
 */
export async function createAgent() {
  // This is now a no-op, kept for backwards compatibility
  return {
    invoke: async ({ input, chat_history }: any) => {
      return runAgent(input, chat_history || [])
    }
  }
}
