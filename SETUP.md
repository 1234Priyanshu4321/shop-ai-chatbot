# Setup Guide

Step-by-step instructions to get the AI Live Chat Agent running locally.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v18 or higher recommended)
- ✅ npm or yarn package manager
- ✅ OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- ✅ Code editor (VS Code recommended)

## Step 1: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env` file in the `backend` directory with the following content:
   ```
   PORT=3001
   DATABASE_URL="file:./dev.db"
   LLM_PROVIDER=groq
   GROQ_API_KEY=your-groq-api-key-here
   ```
   
   **For Groq (recommended, free):**
   - Set `LLM_PROVIDER=groq`
   - Get your free API key at https://console.groq.com/keys
   - Replace `your-groq-api-key-here` with your actual Groq API key
   
   **For OpenAI (optional):**
   - Set `LLM_PROVIDER=openai`
   - Add `OPENAI_API_KEY=your-openai-api-key-here`
   - Get your API key at https://platform.openai.com/api-keys

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Create database and run migrations
   npm run db:migrate
   ```
   
   When prompted for a migration name, you can use: `init` or just press Enter.

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   You should see: `Backend running on http://localhost:3001`

6. **Test the backend (optional):**
   Open another terminal and test the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```
   Or visit `http://localhost:3001/health` in your browser.

## Step 2: Frontend Setup

1. **Open a new terminal** (keep backend running)

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the frontend dev server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   The terminal will show a URL (usually `http://localhost:5173`). Open it in your browser.

## Step 3: Verify Everything Works

1. You should see the chat interface with "Hi! How can I help you?"
2. Type a message (e.g., "What is your return policy?")
3. Click Send or press Enter
4. You should receive an AI response based on the FAQ knowledge

## Troubleshooting

### Backend Issues

**Error: Cannot find module '@prisma/client'**
- Run: `npm run db:generate`

**Error: Database not found**
- Run: `npm run db:migrate`

**Error: OPENAI_API_KEY is not set**
- Make sure your `.env` file exists and contains the API key
- Restart the backend server after adding the key

**Port 3001 already in use**
- Change the PORT in `.env` to a different number (e.g., 3002)

### Frontend Issues

**Error: Failed to fetch**
- Make sure the backend is running on port 3001
- Check browser console for CORS errors
- Verify the API_URL in `src/routes/+page.svelte` matches your backend URL

**Error: Cannot connect to backend**
- Verify backend is running: `curl http://localhost:3001/health`
- Check if backend and frontend are on the same machine/network

### Database Issues

**Want to reset the database?**
```bash
cd backend
rm prisma/dev.db
npm run db:migrate
```

**Want to view/edit database visually?**
```bash
cd backend
npm run db:studio
```

## Next Steps

- Customize the FAQ knowledge in `backend/src/services/llm.ts`
- Modify the UI styling in `frontend/src/routes/+page.svelte`
- Add more features following the architecture patterns

## Production Deployment

For production, you'll want to:
1. Use PostgreSQL instead of SQLite
2. Add environment variables to your hosting platform
3. Build the frontend: `npm run build` in frontend directory
4. Build the backend: `npm run build` in backend directory
5. Set up proper error logging and monitoring

