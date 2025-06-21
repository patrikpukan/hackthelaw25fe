import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, AlertCircle } from "lucide-react";
import {
  chatApi,
  type ChatMessage,
  type ChatSession,
  ApiError,
} from "../lib/api";

export function LegalMemory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const sessionsData = await chatApi.getSessions();
      setSessions(sessionsData);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      setError(null);
      const sessionMessages = await chatApi.getMessages(sessionId);
      setMessages(sessionMessages);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error("Failed to load session messages:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load conversation"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Send query to backend
      const response = await chatApi.query(
        currentInput,
        currentSessionId || undefined
      );

      // Add assistant response
      setMessages((prev) => [...prev, response.message]);

      // Update current session ID if it's a new conversation
      if (!currentSessionId) {
        setCurrentSessionId(response.sessionId);
        // Reload sessions to get the new one
        loadSessions();
      }
    } catch (err) {
      console.error("Chat query failed:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to send message"
      );

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
  };

  const exampleQueries = [
    "Have we already agreed to something like this liability cap?",
    "What was our fallback the last time we negotiated termination rights?",
    "Are there any conflicts between our privacy policy and client contracts?",
    "Show me all documents that mention intellectual property clauses",
  ];

  const filteredSessions = sessions.filter(
    (session) =>
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false)
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Legal Memory
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Ask questions across all your legal documents
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-red-600 text-sm">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Welcome to Legal Memory
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Ask me anything about your legal documents. I can help you
                  find connections, conflicts, and precedents.
                </p>
                <div className="space-y-2 max-w-2xl mx-auto">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Try asking:
                  </p>
                  {exampleQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(query)}
                      className="block w-full text-left p-3 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      "{query}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-3xl ${
                      message.type === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-4 ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                          <p className="text-xs font-medium mb-2 opacity-80">
                            Sources:
                          </p>
                          <div className="space-y-1">
                            {message.sources.map((source, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-xs opacity-80"
                              >
                                <FileText className="h-3 w-3" />
                                <span>{source.document}</span>
                                {source.page && (
                                  <span>(Page {source.page})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-3xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your legal documents..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* New Conversation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={startNewConversation}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Conversation
            </button>
          </div>

          {/* Quick Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Search Conversations
            </h3>
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          {/* Recent Conversations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Recent Conversations
            </h3>
            <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No conversations yet
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSessionMessages(session.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      currentSessionId === session.id
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="font-medium truncate">{session.name}</div>
                    {session.lastMessage && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {session.lastMessage}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Pro Tips
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Ask about specific clauses or terms</li>
                  <li>• Compare documents or policies</li>
                  <li>• Find precedents and patterns</li>
                  <li>• Check for conflicts or gaps</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
