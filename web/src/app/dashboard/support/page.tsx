"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Bot,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SessionInfo {
  id: string;
  status: string;
  message_count: number;
  customer_email: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
}

interface Message {
  role: string;
  content: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    intent?: string;
    from_agent?: boolean;
    agent_name?: string;
  };
}

interface SessionStats {
  total_sessions: number;
  active: number;
  pending_escalation: number;
  escalated: number;
  resolved: number;
  resolution_rate: number;
}

const statusConfig = {
  active: { color: "text-green-400", bgColor: "bg-green-500/20", icon: MessageCircle },
  pending_escalation: { color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: AlertTriangle },
  escalated: { color: "text-red-400", bgColor: "bg-red-500/20", icon: AlertTriangle },
  resolved: { color: "text-gray-400", bgColor: "bg-gray-500/20", icon: CheckCircle },
};

export default function SupportDashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionMessages]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/chatbot/sessions`).catch(() => null),
        fetch(`${API_URL}/api/chatbot/sessions/stats`).catch(() => null),
      ]);

      if (sessionsRes?.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (statsRes?.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch support data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/chatbot/session/${sessionId}/history`
      );
      if (response.ok) {
        const data = await response.json();
        setSessionMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    await fetchSessionMessages(sessionId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedSession || sending) return;

    setSending(true);
    try {
      const response = await fetch(
        `${API_URL}/api/chatbot/session/${selectedSession}/agent-message?message=${encodeURIComponent(
          messageInput
        )}&agent_name=Support Agent`,
        { method: "POST" }
      );

      if (response.ok) {
        setMessageInput("");
        await fetchSessionMessages(selectedSession);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleResolveSession = async (sessionId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/chatbot/session/${sessionId}/resolve`,
        { method: "POST" }
      );
      if (response.ok) {
        fetchData();
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setSessionMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to resolve session:", error);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (statusFilter !== "all" && session.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        session.customer_email?.toLowerCase().includes(query) ||
        session.customer_name?.toLowerCase().includes(query) ||
        session.last_message?.toLowerCase().includes(query) ||
        session.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-tiktok-cyan animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading support dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-tiktok-cyan to-tiktok-red rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Customer Support</h1>
              <p className="text-gray-400">Manage chat conversations and support tickets</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-tiktok-gray text-white rounded-lg hover:bg-tiktok-gray/80"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <p className="text-gray-400 text-sm">Total Sessions</p>
            <p className="text-white text-2xl font-bold">{stats.total_sessions}</p>
          </div>
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <p className="text-green-400 text-sm">Active</p>
            <p className="text-white text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <p className="text-yellow-400 text-sm">Pending Escalation</p>
            <p className="text-white text-2xl font-bold">{stats.pending_escalation}</p>
          </div>
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <p className="text-red-400 text-sm">Escalated</p>
            <p className="text-white text-2xl font-bold">{stats.escalated}</p>
          </div>
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <p className="text-gray-400 text-sm">Resolution Rate</p>
            <p className="text-white text-2xl font-bold">{stats.resolution_rate}%</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Session List */}
        <div className="lg:col-span-1 bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-tiktok-gray space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-tiktok-gray text-white placeholder-gray-500 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tiktok-cyan"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "pending_escalation", "escalated", "resolved"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={clsx(
                      "px-2 py-1 text-xs rounded capitalize",
                      statusFilter === filter
                        ? "bg-tiktok-cyan text-black"
                        : "bg-tiktok-gray text-gray-400 hover:text-white"
                    )}
                  >
                    {filter.replace("_", " ")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Session List */}
          <div className="overflow-y-auto max-h-[500px]">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const config =
                  statusConfig[session.status as keyof typeof statusConfig] ||
                  statusConfig.active;
                const Icon = config.icon;

                return (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={clsx(
                      "w-full p-4 border-b border-tiktok-gray text-left hover:bg-tiktok-gray/30 transition-colors",
                      selectedSession === session.id && "bg-tiktok-gray/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          config.bgColor
                        )}
                      >
                        <Icon className={clsx("w-5 h-5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium text-sm truncate">
                            {session.customer_name ||
                              session.customer_email ||
                              `Session ${session.id.slice(0, 8)}`}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatTime(session.updated_at)}
                          </span>
                        </div>
                        {session.last_message && (
                          <p className="text-gray-400 text-xs truncate">
                            {session.last_message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={clsx(
                              "text-xs px-2 py-0.5 rounded capitalize",
                              config.bgColor,
                              config.color
                            )}
                          >
                            {session.status.replace("_", " ")}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {session.message_count} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2 bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden flex flex-col h-[600px]">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-tiktok-gray flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">
                    Session {selectedSession.slice(0, 8)}...
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {sessionMessages.length} messages
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolveSession(selectedSession)}
                    className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sessionMessages.map((message, index) => (
                  <div
                    key={index}
                    className={clsx(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-tiktok-cyan/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-tiktok-cyan" />
                      </div>
                    )}
                    <div
                      className={clsx(
                        "max-w-[70%] rounded-xl px-4 py-2",
                        message.role === "user"
                          ? "bg-tiktok-gray text-white"
                          : message.role === "system"
                          ? "bg-yellow-500/20 text-yellow-200"
                          : "bg-tiktok-gray/50 text-white"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.metadata?.confidence && (
                          <span className="text-gray-500 text-xs">
                            {Math.round(message.metadata.confidence * 100)}% conf
                          </span>
                        )}
                        {message.metadata?.from_agent && (
                          <span className="text-tiktok-cyan text-xs">Agent</span>
                        )}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-tiktok-gray flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-tiktok-gray"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a reply as support agent..."
                    className="flex-1 bg-tiktok-gray text-white placeholder-gray-500 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tiktok-cyan"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="px-4 py-2 bg-tiktok-cyan text-black rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
