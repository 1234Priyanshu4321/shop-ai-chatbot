import prisma from '../lib/db';

export async function getOrCreateConversation(sessionId: string | null) {
  if (sessionId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    
    if (conversation) {
      return conversation;
    }
  }

  // Create new conversation
  return await prisma.conversation.create({
    data: {},
    include: { messages: true }
  });
}

export async function saveMessage(
  conversationId: string,
  sender: 'user' | 'ai',
  text: string
) {
  return await prisma.message.create({
    data: {
      conversationId,
      sender,
      text
    }
  });
}

export async function getConversationMessages(conversationId: string) {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  });
}

