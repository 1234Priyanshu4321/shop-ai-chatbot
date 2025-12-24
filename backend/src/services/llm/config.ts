// LLM Provider Configuration
// This allows easy switching between LLM providers without changing routes or UI
export type LLMProvider = 'groq' | 'openai';

export const LLM_CONFIG = {
  provider: (process.env.LLM_PROVIDER || 'groq') as LLMProvider,
  
  // Cost control: Limit context and token usage
  MAX_CONTEXT_MESSAGES: 10, // Only send last N messages to LLM (reduces token usage)
  MAX_TOKENS: 200, // Maximum tokens per response (cost control)
  
  // Model configurations per provider
  models: {
    groq: {
      default: 'llama-3.1-8b-instant',
      alternative: 'llama-3.1-70b-versatile'
    },
    openai: {
      default: 'gpt-3.5-turbo',
      alternative: 'gpt-4'
    }
  }
} as const;

