"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Send, RefreshCcw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type ChatUser = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: "online" | "offline" | "away";
};

type Message = {
  id: string;
  message: string;
  user: string;
  type: "agent" | "customer" | "system";
  timestamp: string;
  sessionId?: string;
};

export function ChatSupportClient() {
  const t = useTranslations("Dashboard.chatSupport");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messagesByUser, setMessagesByUser] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<any>(null);

  // Fetch chat sessions from the API
  const fetchChatSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat sessions');
      }
      
      const chatSessions = await response.json();
      
      // Convert the sessions to our ChatUser format
      const formattedUsers: ChatUser[] = chatSessions.map((session: any) => {
        const lastMessage = session.messages[0]; // We only fetch the latest message in the API
        
        return {
          id: session.sessionId,
          name: session.customerName,
          lastMessage: lastMessage?.content || t("noMessages"),
          timestamp: session.lastMessageAt,
          unreadCount: session.messages.filter((msg: any) => !msg.isRead && msg.type === "CUSTOMER").length,
          status: "online", // We'll assume active sessions are online
        };
      });
      
      setUsers(formattedUsers);
      
      // If there are sessions and no active one is selected, select the first one
      if (formattedUsers.length > 0 && !activeUserId) {
        setActiveUserId(formattedUsers[0].id);
        fetchChatSession(formattedUsers[0].id);
      }
      
      setLoading(false);    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      setLoading(false);
      // Show empty state if we can't load data
      setUsers([]);
      setMessagesByUser({});
      setActiveUserId(null);
    }
  }, [activeUserId, t]);
  
  // Fetch messages for a specific chat session
  const fetchChatSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat session');
      }
      
      const chatSession = await response.json();
      
      // Format the messages for our component
      const formattedMessages: Message[] = chatSession.messages.map((msg: any) => ({
        id: msg.id,
        message: msg.content,
        user: msg.senderName,
        type: msg.senderType.toLowerCase(), // Convert AGENT/CUSTOMER to agent/customer
        timestamp: msg.createdAt,
      }));
      
      // Update the messages for this session
      setMessagesByUser(prev => ({
        ...prev,
        [sessionId]: formattedMessages,
      }));
      
      // Mark messages as read
      // In a real implementation, you would make an API call to update the read status
        } catch (error) {
      console.error('Error fetching chat session:', error);
      // If something goes wrong, show empty messages for this session
      setMessagesByUser(prev => ({
        ...prev,
        [sessionId]: [],
      }));
    }
  }, []);

  // Connect to Pusher and load initial data
  useEffect(() => {
    // Initialize Pusher
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    });

    // Subscribe to the support-chat channel
    const channel = pusherRef.current.subscribe("support-chat");
    
    // Fetch initial chat sessions
    fetchChatSessions();
    
    // Listen for new messages
    channel.bind("message", (data: Message) => {
      console.log("Received new message via Pusher:", data);
      
      // Ensure we have a valid type or default to customer
      const messageType = data.type && ["agent", "customer", "system"].includes(data.type)
        ? data.type
        : "customer";
      
      // Normalize the message data
      const normalizedData = {
        ...data,
        type: messageType,
        user: data.user || "Unknown",
        message: data.message || "",
        timestamp: data.timestamp || new Date().toISOString(),
      };
      
      // For system messages, we don't assign to a particular session
      if (messageType === "system") {
        // Show a notification or handle system messages
        console.log("System message:", normalizedData.message);
        return;
      }
      
      // Handle session identification
      let targetSessionId = normalizedData.sessionId;
      
      if (!targetSessionId) {
        // Try to find the session by user name
        const existingUser = users.find(user => user.name === normalizedData.user);
        targetSessionId = existingUser?.id;
      }
      
      if (targetSessionId) {
        // Update messages for existing session
        setMessagesByUser(prev => ({
          ...prev,
          [targetSessionId]: [...(prev[targetSessionId] || []), normalizedData],
        }));
        
        // Update user metadata
        setUsers(prevUsers => {
          return prevUsers.map(user => {
            if (user.id === targetSessionId) {
              return {
                ...user,
                lastMessage: normalizedData.message,
                timestamp: normalizedData.timestamp,
                unreadCount: targetSessionId === activeUserId ? 0 : user.unreadCount + 1,
              };
            }
            return user;
          });
        });
      } else if (messageType === "customer") {
        // If it's a message from a customer we don't have in our list yet
        // This means it's probably a new chat session, so refresh the session list
        fetchChatSessions();
      }
    });

    setConnected(true);

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("support-chat");
        pusherRef.current = null;
      }
    };
  }, [fetchChatSessions]);

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByUser, activeUserId]);

  // Helper function to find a user ID by name
  const findUserIdByName = (name: string): string | undefined => {
    const user = users.find(u => u.name === name);
    return user?.id;
  };

  // Select a user to chat with
  const selectUser = (userId: string) => {
    // Mark messages as read
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            unreadCount: 0,
          };
        }
        return user;
      });
    });
    
    setActiveUserId(userId);
  };

  // Send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeUserId || !newMessage.trim()) return;
    
    const activeUser = users.find(user => user.id === activeUserId);
    if (!activeUser) return;

    const agentMessage: Message = {
      id: Date.now().toString(),
      message: newMessage.trim(),
      user: "Support Agent",
      type: "agent",
      timestamp: new Date().toISOString(),
      sessionId: activeUserId,
    };

    // Add to local state immediately for optimistic UI update
    setMessagesByUser(prev => ({
      ...prev,
      [activeUserId]: [...(prev[activeUserId] || []), agentMessage],
    }));

    setNewMessage("");

    // Send to the server
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: agentMessage.message,
          user: agentMessage.user,
          type: agentMessage.type,
          sessionId: activeUserId,
        }),
      });

      if (!response.ok) {
        // If there's an error, we should handle it and potentially revert the optimistic update
        const errorData = await response.json();
        console.error("Error sending message:", errorData);
        throw new Error(errorData.error || "Failed to send message");
      }

      // Message sent successfully
      const data = await response.json();
      console.log("Message sent successfully:", data);
    } catch (error) {
      console.error("Error sending message:", error);
      // If there was an error, we could remove the optimistic update and show an error message
      setMessagesByUser(prev => {
        // Create a new array without the last message (our optimistic update)
        const updatedMessages = [...prev[activeUserId]];
        updatedMessages.pop();
        
        return {
          ...prev,
          [activeUserId]: updatedMessages,
        };
      });
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return t("today");
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return t("yesterday");
    }
    
    return date.toLocaleDateString();
  };

  // Refresh the chat list
  const refreshChats = () => {
    // In a real app, this would fetch the latest chats from the server
    // For now, we'll just simulate it by adding a new user
    const newUser: ChatUser = {
      id: `user${users.length + 1}`,
      name: `New Customer ${users.length + 1}`,
      lastMessage: "Hello, I need help with my order",
      timestamp: new Date().toISOString(),
      unreadCount: 1,
      status: "online",
    };

    setUsers([newUser, ...users]);
    
    setMessagesByUser(prev => ({
      ...prev,
      [newUser.id]: [
        {
          id: "1",
          message: "Hello, I need help with my order",
          user: newUser.name,
          type: "customer",
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  };

  // Get the status color for a user
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-4">
          <CardTitle>{t("chatDashboard")}</CardTitle>
          <CardDescription className="flex items-center">
            <span className={cn("h-2 w-2 rounded-full mr-1", connected ? "bg-green-500" : "bg-red-500")}></span>
            {connected ? t("connected") : t("disconnected")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex">
          <Tabs defaultValue="active" className="flex h-full w-full">
            <div className="w-80 flex flex-col border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">{t("activeChats")}</TabsTrigger>
                  <TabsTrigger value="closed">{t("closedChats")}</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <TabsContent value="active" className="m-0">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-medium">{t("customers")}</h3>
                    <Button variant="ghost" size="icon" onClick={refreshChats}>
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {users.map(user => (
                      <button
                        key={user.id}
                        className={cn(
                          "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                          activeUserId === user.id && "bg-blue-50"
                        )}
                        onClick={() => selectUser(user.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <UserCircle className="h-10 w-10" />
                            </Avatar>
                            <span 
                              className={cn(
                                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                                getStatusColor(user.status)
                              )} 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{user.name}</p>
                              <span className="text-xs text-gray-500">{formatTimestamp(user.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{user.lastMessage}</p>
                          </div>
                          {user.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-auto rounded-full">
                              {user.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="closed" className="m-0 p-4">
                  <div className="text-center py-8 text-gray-500">
                    <p>{t("noClosedChats")}</p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col">
              {activeUserId ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <UserCircle className="h-8 w-8" />
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {users.find(u => u.id === activeUserId)?.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {users.find(u => u.id === activeUserId)?.status === "online"
                            ? t("online")
                            : users.find(u => u.id === activeUserId)?.status === "away"
                            ? t("away")
                            : t("offline")}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        // In a real app, this would mark the conversation as resolved
                        alert(t("chatResolved"));
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t("resolveChat")}
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    {messagesByUser[activeUserId]?.map((message, index) => {
                      // Check if we need to show the date
                      const showDate =
                        index === 0 ||
                        formatDate(message.timestamp) !==
                          formatDate(messagesByUser[activeUserId][index - 1].timestamp);

                      return (
                        <React.Fragment key={message.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <div className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                                {formatDate(message.timestamp)}
                              </div>
                            </div>
                          )}
                          <div
                            className={cn(
                              "flex mb-4",
                              message.type === "agent" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg p-3",
                                message.type === "agent"
                                  ? "bg-blue-600 text-white rounded-br-none"
                                  : "bg-gray-100 text-gray-800 rounded-bl-none"
                              )}
                            >
                              <p>{message.message}</p>
                              <p className="text-xs opacity-70 mt-1 text-right">
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  <CardFooter className="border-t border-gray-200 p-4">
                    <form onSubmit={sendMessage} className="flex w-full gap-2">
                      <Input
                        type="text"
                        placeholder={t("typeMessage")}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        {t("send")}
                      </Button>
                    </form>
                  </CardFooter>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">{t("noActiveChat")}</h3>
                    <p className="text-gray-500">{t("selectCustomer")}</p>
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
