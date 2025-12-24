import { LLM_CONFIG } from './llm/config';
import { generateWithGroq, validateGroqConfig } from './llm/providers/groq';
import { generateWithOpenAI, validateOpenAIConfig } from './llm/providers/openai';

// FAQ and domain knowledge
const FAQ_KNOWLEDGE = `
Shipping Information:
- Orders ship within 3-5 business days
- We ship to USA and India
- Free shipping on orders over $50

Returns Policy:
- 7-day return window for unused items
- Items must be in original packaging
- Contact support to initiate a return

Product Information:
- All products are quality tested
- We offer a 30-day satisfaction guarantee
- Customer support is available 24/7

Payment:
- We accept all major credit cards
- Secure checkout process
- Order confirmation sent via email
`;

// Improved system prompt with better guardrails
const SYSTEM_PROMPT = `You are a helpful and friendly support agent for a small e-commerce store. 
Answer customer questions clearly and concisely. Be professional but warm.

CRITICAL GUIDELINES:
${FAQ_KNOWLEDGE}

IMPORTANT RULES:
1. Always stay polite and professional, even if the customer is frustrated
2. ONLY answer questions about: shipping, returns, products, payment, or general store policies
3. If asked about topics outside these areas (politics, weather, unrelated products, etc.), politely redirect: "I can help you with shipping, returns, products, or payments. For other questions, please contact our support team at support@store.com."
4. DO NOT make up or guess policies - only use the information provided above
5. If you don't know something, acknowledge it and suggest they contact support: "I don't have that information, but our support team can help. Contact them at support@store.com."
6. Keep responses brief and helpful (2-3 sentences typically)
7. Never apologize excessively - be confident and helpful`;

// Helper function to sleep/delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateReply(
  conversationHistory: Array<{ sender: string; text: string }>,
  userMessage: string,
  retries = 2
): Promise<string> {
  const provider = LLM_CONFIG.provider;
  
  // Validate provider configuration
  if (provider === 'groq') {
    validateGroqConfig();
  } else if (provider === 'openai') {
    validateOpenAIConfig();
  } else {
    throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: groq, openai`);
  }

  // Build conversation messages
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  // Cost control: Only send last N messages to reduce token usage
  const recentHistory = conversationHistory.slice(-LLM_CONFIG.MAX_CONTEXT_MESSAGES);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  // Get model for current provider
  const model = LLM_CONFIG.models[provider].default;

  // Retry logic for rate limits
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let reply: string;
      
      if (provider === 'groq') {
        reply = await generateWithGroq(messages, LLM_CONFIG.MAX_TOKENS, model);
      } else {
        reply = await generateWithOpenAI(messages, LLM_CONFIG.MAX_TOKENS, model);
      }

      return reply;
    } catch (error: any) {
      const statusCode = error?.status || error?.statusCode || error?.response?.status;
      
      // If it's a rate limit (429) and we have retries left, wait and retry
      if (statusCode === 429 && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Rate limit hit. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries + 1})`);
        await sleep(waitTime);
        continue; // Retry the request
      }
      
      // For other errors or if we're out of retries, log and throw
      console.error(`${provider.toUpperCase()} API Error Details:`, {
        message: error?.message,
        status: statusCode,
        code: error?.code,
        type: error?.type,
        attempt: attempt + 1,
        provider
      });
      
      // Log the full error for debugging
      if (error?.response) {
        console.error(`${provider.toUpperCase()} API Response Error:`, error.response);
      }
      
      // Add statusCode to error for easier checking
      if (statusCode) {
        error.status = statusCode;
        error.statusCode = statusCode;
      }
      
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Failed to generate reply after retries');
}

