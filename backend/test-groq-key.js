// Quick script to test if Groq API key is working
require('dotenv').config();

const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;

console.log('Testing Groq API Key...\n');

if (!apiKey || apiKey === 'your-groq-api-key-here') {
  console.error('❌ ERROR: GROQ_API_KEY is not set in .env file');
  console.log('\nPlease add your API key to backend/.env file:');
  console.log('GROQ_API_KEY=gsk_...');
  console.log('\nGet your free API key at: https://console.groq.com/keys');
  process.exit(1);
}

console.log('✅ API Key found in .env');
console.log(`Key starts with: ${apiKey.substring(0, 7)}...`);

// Test the API key by making a simple request
const groq = new Groq({ apiKey });

console.log('\nTesting API connection...');

groq.chat.completions.create({
  model: 'llama-3.1-70b-versatile',
  messages: [{ role: 'user', content: 'Say "Hello" if you can read this.' }],
  max_tokens: 10
})
  .then(response => {
    console.log('✅ API Key is valid!');
    console.log('Response:', response.choices[0]?.message?.content);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ API Error:', error.message);
    if (error.status === 401) {
      console.error('\nInvalid API key. Please check your API key in the .env file.');
      console.error('Get your free API key at: https://console.groq.com/keys');
    } else if (error.status === 429) {
      console.error('\nRate limit exceeded. Please try again later.');
    } else {
      console.error('\nFull error:', error);
    }
    process.exit(1);
  });

