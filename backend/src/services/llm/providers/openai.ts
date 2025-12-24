import OpenAI from 'openai';

// Lazy initialization - only create client when actually needed
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export async function generateWithOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens: number,
  model: string = 'gpt-3.5-turbo'
) {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: maxTokens
  });

  const reply = completion.choices[0]?.message?.content;
  
  if (!reply) {
    throw new Error('No response from OpenAI');
  }

  return reply.trim();
}

export function validateOpenAIConfig(): void {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY is not configured. Please set it in your .env file.');
  }
}

