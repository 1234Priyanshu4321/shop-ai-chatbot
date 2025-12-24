import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getOrCreateConversation, saveMessage, getConversationMessages } from "./services/conversation";
import { generateReply } from "./services/llm";
import { chatRateLimiter } from "./middleware/rateLimit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get chat history for a session
app.get("/chat/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const messages = await getConversationMessages(sessionId);
    
    res.json({
      messages: messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Chat message endpoint with rate limiting
app.post("/chat/message", chatRateLimiter, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validation
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Limit message length to prevent abuse
    if (message.length > 1000) {
      return res.status(400).json({ error: "Message is too long (max 1000 characters)" });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(sessionId || null);
    const conversationId = conversation.id;

    // Save user message
    await saveMessage(conversationId, "user", message.trim());

    // Get conversation history for context
    const history = conversation.messages.map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    // Generate AI reply
    let aiReply: string;
    try {
      aiReply = await generateReply(history, message.trim());
    } catch (llmError: any) {
      console.error("LLM Error:", llmError);
      
      // Provide more specific error messages for common issues
      if (llmError?.message?.includes('API_KEY') || llmError?.message?.includes('not configured')) {
        aiReply = "Configuration error: LLM API key is not set. Please check your backend configuration.";
      } else if (llmError?.status === 401 || llmError?.statusCode === 401) {
        aiReply = "Authentication error: Invalid API key. Please check your API key in the .env file.";
      } else if (llmError?.status === 429 || llmError?.statusCode === 429) {
        aiReply = "I'm experiencing high traffic right now. Please wait a moment and try again.";
      } else {
        // Generic fallback
        aiReply = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or contact our support team for immediate assistance.";
      }
    }

    // Save AI reply
    await saveMessage(conversationId, "ai", aiReply);

    res.json({
      reply: aiReply,
      sessionId: conversationId
    });
  } catch (error) {
    console.error("Error processing chat message:", error);
    res.status(500).json({ 
      error: "Failed to process message",
      reply: "I'm experiencing some technical difficulties. Please try again later."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
