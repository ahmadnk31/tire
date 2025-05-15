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

    // Enhanced validation with better error messages
    if (!message) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'User identifier is required' },
        { status: 400 }
      );
    }
    
    if (!type || !['agent', 'customer', 'system'].includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Valid message type is required (agent, customer, or system)' },
        { status: 400 }
      );
    }

    let chatSession;
    // Convert type to enum value, handling case-insensitivity
    let messageType: ChatMessageType;
    
    switch(type.toLowerCase()) {
      case 'agent':
        messageType = ChatMessageType.AGENT;
        break;
      case 'system':
        messageType = ChatMessageType.SYSTEM;
        break;
      default:
        messageType = ChatMessageType.CUSTOMER;
    }

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
            ...(type.toLowerCase() === 'agent' && {
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
        senderType: type.toLowerCase(), // Store the lowercase version for consistency
        isRead: type.toLowerCase() === 'agent', // Agent messages are read by default
      },
    });

    // Format the message for Pusher
    const pusherMessage = {
      id: chatMessage.id,
      message,
      user,
      type: type.toLowerCase(), // Ensure consistent type for the client
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
  } catch (error: any) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: error.message },
      { status: 500 }
    );
  }
}

// API route to fetch chat sessions
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const locale = url.headers.get('accept-language') || 'en';
    
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
      
      return NextResponse.json(chatSessions, {
        headers: {
          // Add content language for multilingual support
          'Content-Language': locale
        }
      });
    }
  } catch (error: any) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions', details: error.message },
      { status: 500 }
    );
  }
}
