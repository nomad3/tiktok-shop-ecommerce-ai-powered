"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    intent?: string;
    needs_human?: boolean;
    from_agent?: boolean;
    agent_name?: string;
  };
}

interface ChatResponse {
  session_id: string;
  response: string;
  suggested_actions: string[];
  needs_human: boolean;
  confidence: number;
  intent: string;
  timestamp: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    "Track my order",
    "Product help",
    "Return an item",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Add initial greeting when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        role: "assistant",
        content:
          "Hi! Welcome to TikTok Shop support. I'm here to help with orders, products, shipping, and more. How can I assist you today?",
        timestamp: new Date().toISOString(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setSuggestedActions([]);

    try {
      const response = await fetch(`${API_URL}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data: ChatResponse = await response.json();

      // Store session ID for subsequent messages
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
        metadata: {
          confidence: data.confidence,
          intent: data.intent,
          needs_human: data.needs_human,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestedActions(data.suggested_actions);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting right now. Please try again or contact support directly.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setSuggestedActions(["Try again", "Contact support"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleEscalate = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/chatbot/session/${sessionId}/escalate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Customer requested human support",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const systemMessage: Message = {
          role: "system",
          content: `${data.message}\n\nTicket #${data.ticket_id} has been created. ${data.estimated_response_time}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
        setSuggestedActions([]);
      }
    } catch (error) {
      console.error("Escalation error:", error);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          isOpen
            ? "bg-tiktok-gray text-white"
            : "bg-gradient-to-r from-tiktok-red to-pink-500 text-white hover:scale-110"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[350px] sm:w-[400px] h-[500px] bg-tiktok-dark border border-tiktok-gray rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-tiktok-red to-pink-500 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">TikTok Shop Support</h3>
              <p className="text-white/80 text-xs">
                Typically replies instantly
              </p>
            </div>
            <button
              onClick={handleEscalate}
              className="text-white/80 hover:text-white text-xs px-2 py-1 bg-white/10 rounded"
              title="Talk to a human"
            >
              Human Agent
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-tiktok-black">
            {messages.map((message, index) => (
              <div
                key={index}
                className={clsx(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role !== "user" && (
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "system"
                        ? "bg-yellow-500/20"
                        : "bg-tiktok-cyan/20"
                    )}
                  >
                    {message.role === "system" ? (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-tiktok-cyan" />
                    )}
                  </div>
                )}
                <div
                  className={clsx(
                    "max-w-[75%] rounded-2xl px-4 py-2",
                    message.role === "user"
                      ? "bg-tiktok-red text-white rounded-br-sm"
                      : message.role === "system"
                      ? "bg-yellow-500/20 text-yellow-200 rounded-bl-sm"
                      : "bg-tiktok-gray text-white rounded-bl-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.metadata?.from_agent && (
                    <p className="text-xs text-white/60 mt-1">
                      - {message.metadata.agent_name || "Support Agent"}
                    </p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-tiktok-gray flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-tiktok-cyan/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-tiktok-cyan" />
                </div>
                <div className="bg-tiktok-gray rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                    <span
                      className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <span
                      className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {suggestedActions.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-tiktok-dark border-t border-tiktok-gray flex flex-wrap gap-2">
              {suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="px-3 py-1 text-xs bg-tiktok-gray hover:bg-tiktok-gray/80 text-white rounded-full transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-tiktok-dark border-t border-tiktok-gray"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 bg-tiktok-gray text-white placeholder-gray-500 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-tiktok-cyan disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 bg-tiktok-red hover:bg-tiktok-red/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
