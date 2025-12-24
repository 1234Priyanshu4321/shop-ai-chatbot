# Architecture Overview

This document explains the technical architecture and design decisions of the AI Live Chat Agent.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         SvelteKit Frontend (TypeScript)              │   │
│  │  - Chat UI Component (+page.svelte)                  │   │
│  │  - Session Management (localStorage)                 │   │
│  │  - HTTP Client (fetch API)                           │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │ HTTP/REST (JSON)
                        │ POST /chat/message
                        │ GET /chat/history/:sessionId
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Backend API Server                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Express.js (Node.js + TypeScript)             │   │
│  │                                                        │   │
│  │  Routes Layer:                                        │   │
│  │  - POST /chat/message                                │   │
│  │  - GET /chat/history/:sessionId                      │   │
│  │  - GET /health                                       │   │
│  │                                                        │   │
│  │  Services Layer:                                      │   │
│  │  ┌──────────────────┐  ┌────────────────────────┐   │   │
│  │  │ conversation.ts  │  │      llm.ts            │   │   │
│  │  │ - DB operations  │  │ - OpenAI integration   │   │   │
│  │  │ - Session mgmt   │  │ - Prompt engineering   │   │   │
│  │  └────────┬─────────┘  └──────────┬─────────────┘   │   │
│  └───────────┼───────────────────────┼───────────────────┘   │
└──────────────┼───────────────────────┼───────────────────────┘
               │                       │
       ┌───────▼────────┐     ┌───────▼────────┐
       │                │     │                │
       │   SQLite DB    │     │   OpenAI API   │
       │   (Prisma)     │     │   (GPT-3.5)    │
       │                │     │                │
       │ - Conversations│     │ - LLM Service  │
       │ - Messages     │     │ - Context      │
       └────────────────┘     └────────────────┘
```

## Data Flow

### Sending a Message

1. **User types message** → Frontend UI (`+page.svelte`)
2. **User clicks Send** → `sendMessage()` function called
3. **HTTP POST request** → `POST /chat/message` with `{ message, sessionId }`
4. **Backend receives request** → `src/index.ts` route handler
5. **Validation** → Check message is not empty, not too long
6. **Get/Create Conversation** → `conversation.ts` service
   - If sessionId exists: fetch conversation from DB
   - If not: create new conversation
7. **Save User Message** → Store in database via Prisma
8. **Generate AI Reply** → `llm.ts` service
   - Build context from conversation history
   - Send to OpenAI API with system prompt + FAQ
   - Receive AI response
9. **Save AI Reply** → Store in database
10. **Return Response** → `{ reply, sessionId }` to frontend
11. **Update UI** → Display AI message in chat

### Loading Chat History

1. **Page loads** → `onMount()` in `+page.svelte`
2. **Check localStorage** → Get stored `sessionId`
3. **If sessionId exists** → `GET /chat/history/:sessionId`
4. **Backend fetches messages** → From database via Prisma
5. **Return messages** → Array of `{ sender, text, timestamp }`
6. **Render messages** → Display in UI

## Database Schema

### Conversations Table
```prisma
model Conversation {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}
```

**Purpose**: Represents a chat session/conversation.

### Messages Table
```prisma
model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(...)
  sender         String       // "user" or "ai"
  text           String
  createdAt      DateTime     @default(now())
}
```

**Purpose**: Stores individual messages in a conversation.

**Relationships**: 
- Many Messages belong to one Conversation (1:N)
- Cascade delete: deleting conversation deletes all messages

## Service Layer Design

### Conversation Service (`conversation.ts`)

**Responsibilities:**
- Conversation CRUD operations
- Message persistence
- Session management

**Functions:**
- `getOrCreateConversation(sessionId)` - Fetch or create conversation
- `saveMessage(conversationId, sender, text)` - Persist message
- `getConversationMessages(conversationId)` - Get all messages for a conversation

### LLM Service (`llm.ts`)

**Responsibilities:**
- OpenAI API integration
- Prompt engineering
- Context management

**Key Components:**
- `FAQ_KNOWLEDGE` - Domain-specific information
- `SYSTEM_PROMPT` - Instructions for AI behavior
- `generateReply(history, userMessage)` - Main LLM interaction

**Design Pattern:**
- Separated service makes it easy to:
  - Swap LLM providers (OpenAI → Claude → etc.)
  - Test LLM interactions independently
  - Modify prompts without touching route handlers

## Frontend Architecture

### Component Structure

```
+page.svelte (Main Chat Component)
├── State Management
│   ├── messages: Message[]
│   ├── input: string
│   ├── loading: boolean
│   └── sessionId: string | null
│
├── Lifecycle
│   └── onMount() - Load chat history
│
├── Functions
│   ├── sendMessage() - Send user message
│   ├── loadChatHistory() - Fetch previous messages
│   └── scrollToBottom() - UX helper
│
└── UI
    ├── Chat Header
    ├── Messages Container (scrollable)
    └── Input Container
```

### State Management

- **Local state** (Svelte reactive variables)
- **localStorage** for session persistence
- **No external state management** (SvelteKit has built-in reactivity)

## Error Handling Strategy

### Backend Error Handling

1. **Validation Errors** (400)
   - Empty messages
   - Messages too long (>1000 chars)
   - Invalid session ID format

2. **LLM API Errors** (500)
   - OpenAI API failure → Fallback message
   - Network errors → Graceful degradation
   - Invalid API key → Error logged, user-friendly message

3. **Database Errors** (500)
   - Connection issues → Error response
   - Query failures → Logged and handled

### Frontend Error Handling

1. **Network Errors**
   - Failed fetch → Display error message in chat
   - Connection timeout → User-friendly message

2. **API Errors**
   - Non-200 responses → Error handling in catch block
   - Invalid responses → Fallback UI state

## Security Considerations

### Current Implementation

- ✅ Input validation (message length, type checking)
- ✅ CORS enabled (configured for development)
- ✅ Environment variables for sensitive data (API keys)
- ✅ SQL injection protection (Prisma parameterized queries)

### Production Recommendations

- [ ] Rate limiting (prevent API abuse)
- [ ] Input sanitization (XSS prevention)
- [ ] Authentication/authorization
- [ ] HTTPS enforcement
- [ ] API key rotation
- [ ] Request logging and monitoring
- [ ] Database connection pooling
- [ ] Secrets management (e.g., AWS Secrets Manager)

## Scalability Considerations

### Current Limitations

- SQLite is file-based (single-server only)
- No horizontal scaling support
- No caching layer
- No message queuing

### Scaling Path

1. **Database Migration**
   - SQLite → PostgreSQL
   - Enables horizontal scaling
   - Better concurrent access

2. **Caching Layer**
   - Redis for session storage
   - Cache frequently accessed conversations

3. **Message Queue**
   - RabbitMQ/Kafka for async LLM processing
   - Handle high traffic spikes

4. **Load Balancing**
   - Multiple backend instances
   - Shared database connection pool

5. **CDN for Frontend**
   - Static asset delivery
   - Reduced server load

## Testing Strategy

### Recommended Tests

**Backend:**
- Unit tests for services (conversation, llm)
- Integration tests for API endpoints
- Database migration tests

**Frontend:**
- Component tests (Svelte Testing Library)
- E2E tests (Playwright/Cypress)
- API integration tests

## Performance Optimizations

### Implemented

- Message history limited to last 10 messages for LLM context
- Efficient database queries with indexes
- Lazy loading of chat history

### Future Optimizations

- Virtual scrolling for long message lists
- Debouncing for input
- WebSocket for real-time updates (instead of polling)
- Message pagination
- LLM response streaming

## Trade-offs Made

### SQLite vs PostgreSQL

**Chose SQLite because:**
- ✅ Zero setup required
- ✅ Perfect for development
- ✅ Single-file database (easy backup)
- ✅ Sufficient for small-scale deployments

**Trade-off:**
- ❌ Not suitable for production at scale
- ❌ No concurrent write support
- ❌ Migration to PostgreSQL needed for production

### SvelteKit vs React/Vue

**Chose SvelteKit because:**
- ✅ Simpler mental model
- ✅ Less boilerplate
- ✅ Built-in routing
- ✅ Better performance (smaller bundle)

### Express vs Fastify/NestJS

**Chose Express because:**
- ✅ Simplicity
- ✅ Large ecosystem
- ✅ Easy to understand
- ✅ Minimal setup

**Trade-off:**
- ❌ Less type safety than NestJS
- ❌ Slower than Fastify (negligible for this use case)

## Code Organization Principles

1. **Separation of Concerns**
   - Routes handle HTTP
   - Services handle business logic
   - Database operations abstracted

2. **Single Responsibility**
   - Each service has one clear purpose
   - Functions do one thing well

3. **DRY (Don't Repeat Yourself)**
   - Reusable services
   - Shared utilities

4. **Type Safety**
   - TypeScript throughout
   - Prisma types for database

5. **Error Handling**
   - Try-catch blocks where needed
   - User-friendly error messages
   - Proper logging

