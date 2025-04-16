"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  message: string;
  user: string;
  type: "agent" | "customer";
  timestamp: string;
};

export default function CustomerSupportChat() {
  const t = useTranslations("Chat");
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<any>(null);
  // Connect to Pusher when the chat is opened
  useEffect(() => {
    if (isOpen && !connected) {
      setIsConnecting(true);
      
      // Initialize Pusher
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
      });

      // Subscribe to the support-chat channel
      const channel = pusherRef.current.subscribe("support-chat");
      
      // Check for an existing session in localStorage
      const storedSessionId = localStorage.getItem("chatSessionId");
      
      if (storedSessionId) {
        // Fetch existing chat session
        fetch(`/api/chat?sessionId=${storedSessionId}`)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              // If session not found, clear localStorage and start new chat
              localStorage.removeItem("chatSessionId");
              return null;
            }
          })
          .then(session => {
            if (session && session.messages && session.messages.length > 0) {
              // Format the messages for our component
              const formattedMessages = session.messages.map((msg: any) => ({
                id: msg.id,
                message: msg.content,
                user: msg.senderName,
                type: msg.senderType,
                timestamp: msg.createdAt,
              }));
              
              setMessages(formattedMessages);
              setIsConnecting(false);
              setConnected(true);
            } else {
              // Add a welcome message for new chat
              setTimeout(() => {
                setMessages([
                  {
                    id: "welcome",
                    message: t("welcomeMessage"),
                    user: "Support",
                    type: "agent",
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setIsConnecting(false);
                setConnected(true);
              }, 1000);
            }
          })
          .catch(error => {
            console.error("Error fetching chat session:", error);
            // Fall back to a new session
            setTimeout(() => {
              setMessages([
                {
                  id: "welcome",
                  message: t("welcomeMessage"),
                  user: "Support",
                  type: "agent",
                  timestamp: new Date().toISOString(),
                },
              ]);
              setIsConnecting(false);
              setConnected(true);
            }, 1000);
          });
      } else {
        // Add a welcome message for new chat
        setTimeout(() => {
          setMessages([
            {
              id: "welcome",
              message: t("welcomeMessage"),
              user: "Support",
              type: "agent",
              timestamp: new Date().toISOString(),
            },
          ]);
          setIsConnecting(false);
          setConnected(true);
        }, 1000);
      }

      // Listen for new messages
      channel.bind("message", (data: Message) => {
        // Only add messages from agents (to avoid duplicates of our own messages)
        // or if they're from other sessions
        if (data.type === "agent" || data.id !== localStorage.getItem("chatSessionId")) {
          setMessages((prevMessages) => [...prevMessages, data]);
        }
      });

      return () => {
        // Clean up the subscription when the component unmounts
        if (pusherRef.current) {
          pusherRef.current.unsubscribe("support-chat");
          pusherRef.current = null;
          setConnected(false);
        }
      };
    }
  }, [isOpen, connected, t]);

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      message: message.trim(),
      user: userName,
      type: "customer",
      timestamp: new Date().toISOString(),
    };

    // Add to local state immediately for responsiveness
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setMessage("");

    // Send to the server
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      });
          // Only send an automatic response for the first customer message
    // and only if we don't have any agent messages yet
    const hasAgentMessages = messages.some(msg => msg.type === "agent" && msg.id !== "welcome");
    
    if (!hasAgentMessages) {
      // Add the auto-response to the UI without making an API call
      setTimeout(() => {
        const agentResponse: Message = {
          id: `auto_${Date.now()}`,
          message: t("autoResponse"),
          user: "Support",
          type: "agent",
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, agentResponse]);
        
        // Store the session ID if we receive it in the response
        const sessionId = localStorage.getItem("chatSessionId");
        if (sessionId) {
          // Only make a single API call for the auto-response
          fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...agentResponse,
              sessionId: sessionId
            }),
          }).catch(error => {
            console.error("Error sending auto-response:", error);
          });
        }
      }, 2000);
    }
      
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label={t("openChat")}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[480px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 z-50 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-medium">{t("customerSupport")}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 rounded-full h-8 w-8 p-0"
              aria-label={t("closeChat")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-grow p-4 flex flex-col">
            {isConnecting ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">{t("connecting")}</div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "mb-4 max-w-[80%]",
                      msg.type === "customer"
                        ? "self-end ml-auto"
                        : "self-start mr-auto"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {msg.type === "agent" && (
                        <Avatar className="h-8 w-8 bg-blue-600">
                          <div className="text-xs text-white">S</div>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg p-3",
                          msg.type === "customer"
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-800 rounded-tl-none"
                        )}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {msg.type === "customer" && (
                        <Avatar className="h-8 w-8 bg-gray-600">
                          <div className="text-xs text-white">U</div>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </ScrollArea>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={t("typeMessage")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-grow"
                disabled={isConnecting || !connected}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isConnecting || !connected || !message.trim()}
                aria-label={t("sendMessage")}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
