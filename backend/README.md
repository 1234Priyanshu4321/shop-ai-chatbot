# Backend API

Express + TypeScript backend for AI Live Chat Agent.

## Quick Start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and add your OpenAI API key
3. Run database migrations: `npm run db:migrate`
4. Start server: `npm run dev`

## API Routes

- `POST /chat/message` - Send a message and get AI response
- `GET /chat/history/:sessionId` - Get conversation history
- `GET /health` - Health check

See main README.md for detailed API documentation.

