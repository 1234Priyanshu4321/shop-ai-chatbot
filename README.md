# AI Live Chat Agent

A simple, production-style AI-powered live chat application built as part of a software engineering hiring assignment.

This project focuses on backend correctness, clean architecture, and robustness rather than UI complexity or AI novelty. It represents a realistic customer-support chat system similar to what would exist in a real product.

---

## Overview

The application provides a web-based chat interface backed by a backend API and a language-model-powered support agent.

The main goals of this project are:

- Persist conversations and messages
- Maintain session-based chat history
- Integrate an LLM in a safe and extensible way
- Handle failures gracefully
- Keep the UI intentionally simple and realistic

---

## Features

- Live chat interface built with SvelteKit
- Session-based conversations that persist across page reloads
- Message persistence using SQLite and Prisma
- AI-generated responses with domain guardrails
- Input validation and basic rate limiting
- Graceful handling of LLM and backend failures
- Clear separation between frontend, backend, database, and LLM logic

---

## Tech Stack

### Frontend
- SvelteKit
- TypeScript

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite (for local development)

### LLM
- Groq (LLaMA 3.1) for free, fast development  
- LLM layer is abstracted and can be swapped with OpenAI if needed

---

## Architecture

Browser (SvelteKit UI)  
↓ HTTP  
Backend API (Express + TypeScript)  
↓  
Database (SQLite + Prisma)  
↓  
LLM Provider (Groq or OpenAI)

**Design highlights:**
- LLM logic is isolated in a service layer
- Conversations and messages are persisted
- Session ID is stored client-side and reused
- Backend is channel-agnostic and easy to extend

---

## Local Setup

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm
- A Groq API key from https://console.groq.com

---

### Backend Setup

- Navigate to the backend directory
- Install dependencies using `npm install`
- Create a `.env` file with the following values:
  - `PORT`
  - `DATABASE_URL`
  - `LLM_PROVIDER`
  - `GROQ_API_KEY`
- Generate Prisma client
- Run database migrations
- Start the backend server

The backend runs on **localhost:3001**.

---

### Frontend Setup

- Navigate to the frontend directory
- Install dependencies using `npm install`
- Start the development server

The frontend runs on **localhost:5173**.

---

## API Endpoints

### POST `/chat/message`
Sends a message to the support agent and returns an AI-generated reply along with a session ID.

### GET `/chat/history/:sessionId`
Fetches the full conversation history for an existing session.

### GET `/health`
Simple health check endpoint.

---

## LLM Design Notes

- Only the most recent messages are sent as context to control cost
- Responses are capped in length
- The system prompt includes store-specific FAQ knowledge
- Out-of-scope questions are answered briefly and redirected
- If the LLM fails, a user-friendly fallback message is returned

The application continues to function even if the LLM is unavailable.

---

## Error Handling and Robustness

- Empty or oversized messages are rejected
- Basic rate limiting is applied to prevent abuse
- LLM errors do not crash the server
- Database errors are handled gracefully
- No secrets or environment files are committed to the repository

---

## Trade-offs

- SQLite is used to keep local setup simple; PostgreSQL would be used in production
- REST APIs are used instead of WebSockets to keep the scope focused
- FAQ knowledge is hardcoded instead of managed via an admin panel

These choices prioritize clarity and correctness over over-engineering.

---

## Future Improvements

If extended further, this project could include:
- Automated tests
- Streaming AI responses
- Redis caching
- WebSocket-based real-time updates
- Admin-editable FAQ content
- Production deployment with PostgreSQL

---

## Author

**Priyanshu Chaturvedi**  
Built as part of a software engineering hiring assignment.
