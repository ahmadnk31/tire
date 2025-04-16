import Pusher from 'pusher';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ChatMessageType, ChatSessionStatus } from '@prisma/client';

// Initialize Pusher with your credentials
const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, user, type, sessionId } = body;

    // Validate the request
    if (!message || !user || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let chatSession;
    let messageType: ChatMessageType = type === 'agent' ? ChatMessageType.AGENT : ChatMessageType.CUSTOMER;

    // Find or create the chat session
    if (sessionId) {
      // Try to find an existing session
      chatSession = await prisma.chatSession.findUnique({
        where: { sessionId },
      });
      
      // If no session found but sessionId provided, create new with that ID
      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            sessionId,
            customerName: user,
            status: ChatSessionStatus.ACTIVE,
            lastMessageAt: new Date(),
          },
        });
      } else {
        // Update the last message timestamp
        chatSession = await prisma.chatSession.update({
          where: { id: chatSession.id },
          data: { 
            lastMessageAt: new Date(),
            // If an agent is messaging, ensure the session has the agent's info
            ...(type === 'agent' && {
              agentName: user,
            }),
          },
        });
      }
    } else {
      // Generate a new session ID if none provided
      const newSessionId = `session_${Date.now()}`;
      chatSession = await prisma.chatSession.create({
        data: {
          sessionId: newSessionId,
          customerName: user,
          status: ChatSessionStatus.ACTIVE,
          lastMessageAt: new Date(),
        },
      });
    }

    // Create the chat message in the database
    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        content: message,
        type: messageType,
        senderName: user,
        senderType: type,
        isRead: false,
      },
    });

    // Format the message for Pusher
    const pusherMessage = {
      id: chatMessage.id,
      message,
      user,
      type,
      timestamp: chatMessage.createdAt.toISOString(),
      sessionId: chatSession.sessionId,
    };

    // Trigger the event on the support-chat channel
    await pusher.trigger('support-chat', 'message', pusherMessage);

    return NextResponse.json({ 
      success: true,
      sessionId: chatSession.sessionId,
      messageId: chatMessage.id
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// API route to fetch chat sessions
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (sessionId) {
      // Fetch a specific chat session with its messages
      const chatSession = await prisma.chatSession.findUnique({
        where: { sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      
      if (!chatSession) {
        return NextResponse.json(
          { error: 'Chat session not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(chatSession);
    } else {
      // Fetch all active chat sessions
      const chatSessions = await prisma.chatSession.findMany({
        where: {
          status: { in: [ChatSessionStatus.ACTIVE, ChatSessionStatus.PENDING] }
        },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Just get the latest message for preview
          },
        },
      });
      
      return NextResponse.json(chatSessions);
    }
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}
