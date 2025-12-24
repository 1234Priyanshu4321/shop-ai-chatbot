# AI Live Chat Agent

A production-ready AI-powered live chat application built with SvelteKit frontend and Express/TypeScript backend, featuring OpenAI integration and persistent conversation history.

## Architecture

```
┌─────────────────┐
│  Browser (UI)   │  ← SvelteKit Frontend
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Backend API    │  ← Express + TypeScript
│  (Node.js)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────────┐
│ SQLite │ │  OpenAI API  │
│  (DB)  │ │   (LLM)      │
└────────┘ └──────────────┘
```

## Features

- ✅ Real-time chat interface with clean UI
- ✅ Persistent conversation history (SQLite + Prisma)
- ✅ OpenAI GPT integration with context-aware responses
- ✅ FAQ and domain knowledge built into AI prompts
- ✅ Session management with localStorage
- ✅ Error handling and edge case management
- ✅ Type-safe codebase (TypeScript)

## Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Quick Start (Step-by-Step)

### Step 1: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
Create a `.env` file in the `backend` directory with the following:
```env
PORT=3001
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=your-openai-api-key-here
```
**Important:** Replace `your-openai-api-key-here` with your actual OpenAI API key. Get one from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

4. **Set up the database:**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations (creates the database file)
npm run db:migrate
```
When prompted for a migration name, you can use `init` or just press Enter.

5. **Start the backend server:**
```bash
npm run dev
```
You should see: `Backend running on http://localhost:3001`

### Step 2: Frontend Setup

**Open a new terminal window** (keep backend running in the first terminal)

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open in browser:**
The terminal will show a URL (usually `http://localhost:5173`). Open it in your browser.

### Step 3: Test It Out

1. You should see a chat interface with "Hi! How can I help you?"
2. Try asking: "What is your return policy?" or "Do you ship to USA?"
3. The AI should respond with information from the FAQ knowledge base.

## Project Structure

```
spur-ai-chat/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main server entry point
│   │   ├── lib/
│   │   │   └── db.ts             # Prisma client instance
│   │   └── services/
│   │       ├── conversation.ts   # Conversation/DB operations
│   │       └── llm.ts            # OpenAI integration
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── routes/
    │   │   └── +page.svelte      # Main chat UI
    │   ├── app.css
    │   └── app.html
    └── package.json
```

## API Endpoints

### `POST /chat/message`
Send a chat message and receive AI response.

**Request:**
```json
{
  "message": "Hello, what is your return policy?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "reply": "We offer a 7-day return window...",
  "sessionId": "conversation-uuid"
}
```

### `GET /chat/history/:sessionId`
Get chat history for a session.

**Response:**
```json
{
  "messages": [
    {
      "sender": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "sender": "ai",
      "text": "Hi! How can I help you?",
      "timestamp": "2024-01-01T00:00:01Z"
    }
  ]
}
```

### `GET /health`
Health check endpoint.

## Database Schema

### Conversations
- `id` (UUID, primary key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Messages
- `id` (UUID, primary key)
- `conversationId` (UUID, foreign key)
- `sender` (String: "user" | "ai")
- `text` (String)
- `createdAt` (DateTime)

## LLM Integration Notes

### Provider Selection (Extensible Architecture)

The system supports multiple LLM providers via environment configuration:

- **Default: Groq** (fast, free tier available)
- **Optional: OpenAI** (GPT-3.5-turbo)

**Configuration:**
Set `LLM_PROVIDER=groq` or `LLM_PROVIDER=openai` in `backend/.env`

**Why This Matters:**
- Easy to swap providers without touching routes or UI
- Production-ready extensibility
- Can switch providers based on cost/performance needs

The provider abstraction is in `backend/src/services/llm/`:
- `config.ts` - Provider configuration
- `providers/groq.ts` - Groq implementation
- `providers/openai.ts` - OpenAI implementation
- `llm.ts` - Main service that routes to selected provider

### Prompt Design

The system uses an improved prompt structure with guardrails:

1. **System Prompt:**
   - Defines the AI as a "helpful and friendly support agent for a small e-commerce store"
   - Includes FAQ knowledge directly in the prompt
   - **Guardrails:**
     - Stays polite and professional
     - Redirects out-of-scope queries back to store support
     - Avoids hallucinating policies
     - Only answers questions about: shipping, returns, products, payment
   - Limits responses to 2-3 sentences for conciseness

2. **Conversation Context:**
   - Includes the last 10 messages (configurable via `MAX_CONTEXT_MESSAGES`)
   - Maintains context for follow-up questions
   - Messages are formatted as `user`/`assistant` roles

3. **Cost Control:**
   - `MAX_TOKENS: 200` limits response length (cost control)
   - `MAX_CONTEXT_MESSAGES: 10` limits conversation history sent to LLM (token management)
   - These constants are defined in `backend/src/services/llm/config.ts`
   - Temperature set to 0.7 for balanced creativity/consistency

### FAQ / Domain Knowledge

The following knowledge is hardcoded in the system prompt (`backend/src/services/llm.ts`):
- **Shipping:** 3-5 business days, ships to USA and India, free shipping over $50
- **Returns:** 7-day return window, unused items only, original packaging required
- **Products:** Quality tested, 30-day satisfaction guarantee
- **Support:** Available 24/7
- **Payment:** Major credit cards accepted, secure checkout

To customize, edit the `FAQ_KNOWLEDGE` constant in `backend/src/services/llm.ts`.

## Architecture Overview

### Backend Structure

The backend follows a **layered architecture**:

```
backend/src/
├── index.ts                    # Entry point, route handlers
├── lib/
│   └── db.ts                  # Prisma client singleton
├── middleware/
│   └── rateLimit.ts           # Rate limiting middleware
└── services/
    ├── conversation.ts         # Database operations layer
    └── llm/
        ├── config.ts           # LLM provider configuration
        ├── llm.ts              # Main LLM service (routes to providers)
        └── providers/
            ├── groq.ts         # Groq provider implementation
            └── openai.ts       # OpenAI provider implementation
```

**Design Decisions:**
- **Separation of Concerns:** Routes handle HTTP, services handle business logic, middleware handles cross-cutting concerns
- **LLM Provider Abstraction:** Easy to swap providers via config, no code changes needed
  - Supports Groq and OpenAI (extensible to add more)
  - Provider-specific code isolated in `providers/` directory
- **Service Layer:** Database and LLM operations isolated for easy testing and modification
- **Type Safety:** TypeScript throughout with Prisma-generated types

### Frontend Structure

```
frontend/src/
├── routes/
│   ├── +page.svelte     # Main chat UI component
│   └── +layout.svelte   # Root layout
└── app.css              # Global styles
```

**Design Decisions:**
- **SvelteKit:** Chosen for simplicity, built-in routing, and excellent TypeScript support
- **Reactive State:** Uses Svelte's reactive variables (no external state management needed)
- **Session Persistence:** localStorage stores sessionId, enabling chat history reload

### Data Model

**Conversations Table:**
- `id` (UUID) - Primary key, used as sessionId
- `createdAt`, `updatedAt` - Timestamps

**Messages Table:**
- `id` (UUID) - Primary key
- `conversationId` (UUID) - Foreign key to conversations
- `sender` (String) - "user" or "ai"
- `text` (String) - Message content
- `createdAt` (DateTime) - Timestamp

**Relationships:** One conversation has many messages (1:N), with cascade delete.

## Development

### Backend Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Run production build
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio (DB GUI)
```

### Frontend Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Design Decisions & Trade-offs

### Why SQLite?
- Simple setup (no separate database server needed)
- Perfect for development and small-scale deployments
- Easy to migrate to PostgreSQL later if needed

### Why Prisma?
- Type-safe database queries
- Excellent developer experience
- Easy migrations
- Clean, readable code

### Why SvelteKit?
- Modern, fast, and lightweight
- Great developer experience
- Built-in routing and SSR support
- Excellent TypeScript support

### Why Express?
- Simple and minimal
- Large ecosystem
- Easy to understand for any Node.js developer
- Perfect for REST APIs

## Error Handling & Robustness

The application handles:
- **Input Validation:**
  - Empty messages
  - Messages that are too long (>1000 chars)
  - Type checking and sanitization

- **API Failures:**
  - LLM provider failures (graceful fallback with user-friendly messages)
  - Retry logic with exponential backoff for rate limits
  - Database connection errors
  - Invalid session IDs
  - Network errors on frontend

- **Rate Limiting:**
  - 10 requests per minute per IP address
  - Prevents abuse while allowing normal usage
  - User-friendly error messages when limit is exceeded

- **Security:**
  - Input length limits
  - Rate limiting to prevent abuse
  - Environment variables for sensitive data (API keys)

## Recent Improvements

### Architecture Enhancements

1. **LLM Provider Abstraction** ✅
   - Configurable provider selection via `LLM_PROVIDER` env var
   - Easy to swap between Groq/OpenAI without code changes
   - Demonstrates extensibility and production thinking

2. **Improved Prompt Guardrails** ✅
   - Better system prompt with explicit rules
   - Prevents hallucination of policies
   - Redirects out-of-scope queries appropriately
   - Shows product sense

3. **Cost Control Constants** ✅
   - Explicit `MAX_CONTEXT_MESSAGES` and `MAX_TOKENS` constants
   - Documented why limits exist (cost control, token management)
   - Easy to adjust based on needs

4. **Rate Limiting** ✅
   - 10 requests/minute per IP
   - Prevents abuse
   - Shows production awareness

5. **Message Timestamps** ✅
   - Human-readable timestamps in UI
   - Smart formatting (just now, time, date)
   - Makes chat feel real, not demo-ish

6. **Typing Indicator** ✅
   - "Agent is typing..." indicator
   - Disabled send button during requests
   - Improves perceived quality

## Trade-offs & Design Decisions

### SQLite vs PostgreSQL

**Chose SQLite because:**
- ✅ Zero setup required (single file database)
- ✅ Perfect for development and this assignment
- ✅ Easy to migrate to PostgreSQL later if needed

**Trade-off:**
- ❌ Not suitable for production at scale (single-server only)
- ❌ Limited concurrent write performance

### SvelteKit vs React/Vue

**Chose SvelteKit because:**
- ✅ Simpler mental model and less boilerplate
- ✅ Better performance (smaller bundle size)
- ✅ Built-in routing and SSR support
- ✅ Excellent TypeScript integration

### Express vs Fastify/NestJS

**Chose Express because:**
- ✅ Simplicity and minimal setup
- ✅ Large ecosystem and community
- ✅ Easy to understand for any Node.js developer

**Trade-off:**
- ❌ Less built-in structure than NestJS (but simpler for this scope)

### Hardcoded FAQ vs Database

**Chose hardcoded FAQ because:**
- ✅ Simpler for this assignment
- ✅ No additional database queries needed
- ✅ Easy to modify in code

**Trade-off:**
- ❌ Requires code deployment to update FAQs (vs. admin panel)
- ✅ Could easily be moved to database if needed

## If I Had More Time...

Here's what I would add or improve:

1. **Testing:**
   - Unit tests for services (conversation, llm)
   - Integration tests for API endpoints
   - E2E tests for the chat flow

2. **Production Readiness:**
   - Rate limiting (prevent API abuse)
   - Input sanitization (XSS prevention)
   - Request logging and monitoring
   - Database connection pooling
   - Migrate to PostgreSQL for production

3. **Enhanced UX:**
   - Message timestamps in UI
   - Typing indicators (real-time)
   - Message reactions/feedback
   - Copy message to clipboard
   - Dark mode

4. **LLM Improvements:**
   - Response streaming (show tokens as they generate)
   - Fallback to different LLM provider if primary fails
   - Configurable model selection
   - Token usage tracking and reporting

5. **Developer Experience:**
   - Docker setup for easy local development
   - Pre-commit hooks (linting, formatting)
   - CI/CD pipeline
   - API documentation (Swagger/OpenAPI)

6. **Scalability:**
   - Redis caching for frequently accessed conversations
   - Message queue for async LLM processing
   - WebSocket support for real-time updates
   - Horizontal scaling support

**Current Focus:**
I prioritized code quality, architecture, and robustness over adding extra features, as the assignment emphasized these aspects.

## Deployment

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Deploy Options:**
- **Backend:** Render, Railway, or similar (Node.js + PostgreSQL)
- **Frontend:** Vercel (excellent SvelteKit support), Netlify, or Render Static

**Remember to:**
- Use PostgreSQL for production (not SQLite)
- Set environment variables on your hosting platform
- Update CORS settings to allow your frontend domain
- Update API_URL in frontend code to point to your deployed backend

## License

ISC

## Author

Built as a hiring assignment for Spur Software Engineer position.

