import Groq from 'groq-sdk';

// Lazy initialization - only create client when actually needed
function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
}

export async function generateWithGroq(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens: number,
  model: string = 'llama-3.1-8b-instant'
) {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: maxTokens
  });

  const reply = completion.choices[0]?.message?.content;
  
  if (!reply) {
    throw new Error('No response from Groq');
  }

  return reply.trim();
}

export function validateGroqConfig(): void {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your-groq-api-key-here' || apiKey.trim() === '') {
    throw new Error('GROQ_API_KEY is not configured. Please set it in your .env file.');
  }
}

