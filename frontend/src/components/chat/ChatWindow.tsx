import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, BookOpen, X, FileText, Plus, MessageSquare, History, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import {
  sendMessage,
  getDocuments,
  getChatSessions,
  getSessionMessages,
  deleteSession,
  type Message,
  type Citation,
  type UploadedDocument,
  type ChatSession
} from '@/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const suggestedQueries = [
  "What are the GST registration requirements?",
  "How to claim Input Tax Credit?",
  "E-invoicing compliance for FY 2024-25",
  "GST rates for IT services",
];

const INITIAL_MESSAGE: Message = {
  id: '1',
  content: "Hello! I'm your AI-powered GST compliance assistant. I can help you understand Indian GST laws, registration requirements, Input Tax Credit, and more. How can I assist you today?",
  role: 'assistant',
  timestamp: new Date(),
};

export function ChatWindow() {
  const [searchParams, setSearchParams] = useSearchParams();
  const docId = searchParams.get('docId');

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [focusedDoc, setFocusedDoc] = useState<UploadedDocument | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const history = await getChatSessions();
      setSessions(history);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  const discussDoc = searchParams.get('discussDoc');

  // Load focused document info if docId is present
  useEffect(() => {
    if (docId) {
      async function loadDoc() {
        try {
          const docs = await getDocuments();
          const doc = docs.find(d => d.id.toString() === docId);
          if (doc) {
            setFocusedDoc(doc);
            setMessages(prev => {
              const systemMsgId = `system-focus-${doc.id}`;
              if (prev.some(m => m.id === systemMsgId)) return prev;

              return [
                ...prev,
                {
                  id: systemMsgId,
                  content: `I am now focusing on your document: **${doc.name}**. You can ask me questions specifically about its compliance status or the issues flagged.`,
                  role: 'assistant',
                  timestamp: new Date(),
                }
              ];
            });
          }
        } catch (err) {
          console.error('Failed to load focused document:', err);
        }
      }
      loadDoc();
    } else {
      setFocusedDoc(null);
    }
  }, [docId]);

  // Handle auto-discussion for new drive documents
  useEffect(() => {
    if (discussDoc && messages.length === 1 && !isLoading) {
      const autoMessage = `What is the new document "${discussDoc}" about? Please provide a summary and its compliance implications.`;
      const docToDiscuss = discussDoc; // Capture for the async call

      // Clear the param immediately so it doesn't re-trigger
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('discussDoc');
      setSearchParams(newParams);

      // We trigger the send logic
      triggerAutoSend(autoMessage, docToDiscuss);
    }
  }, [discussDoc, messages.length]);

  const triggerAutoSend = async (content: string, docName?: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessage(
        userMessage.content,
        [INITIAL_MESSAGE, userMessage],
        undefined,
        undefined,
        docName
      );

      setMessages((prev) => [...prev, response]);
      if (response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to auto-send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(
        userMessage.content,
        [...messages.slice(-5), userMessage],
        currentConversationId || undefined,
        docId || undefined
      );

      setMessages((prev) => [...prev, response]);

      // Update session ID if it was newly created
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        loadSessions(); // Refresh list to show the new title
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setCurrentConversationId(null);
    setInput('');
    // Clear docId from URL if present
    if (docId) {
      setSearchParams({});
    }
  };

  const handleSelectSession = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const historyMessages = await getSessionMessages(conversationId);
      if (historyMessages.length > 0) {
        setMessages(historyMessages);
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
      setCurrentConversationId(conversationId);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const success = await deleteSession(conversationId);
      if (success) {
        setSessions(prev => prev.filter(s => s.conversation_id !== conversationId));
        if (currentConversationId === conversationId) {
          handleNewChat();
        }
        toast.success('Conversation deleted');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete conversation');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const handleCitationClick = (citationId: string) => {
    const allCitations = messages.flatMap((m) => m.citations || []);
    const citation = allCitations.find((c) => c.id === citationId);
    if (citation) {
      setSelectedCitation(citation);
    }
  };

  const followUpSuggestions = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.suggestions && m.suggestions.length > 0)?.suggestions || [];

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sidebar Toggle Button (Mobile & Desktop) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-40 p-1.5 rounded-full bg-card border border-zinc-200/60 dark:border-zinc-800 shadow-lg lg:flex items-center justify-center transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
          isSidebarOpen ? "lg:left-[268px]" : "lg:left-4"
        )}
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* History Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 250, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex flex-col border-r border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
          >
            <div className="p-4">
              <Button
                onClick={handleNewChat}
                className="w-full justify-start gap-2 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 rounded-xl font-bold py-6 shadow-sm"
              >
                <Plus size={18} />
                New Conversation
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-none">
              <div className="px-3 mb-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={12} />
                  Recent Conversations
                </p>
              </div>

              {sessions.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-zinc-500">No previous chats Yet</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.conversation_id}
                    onClick={() => handleSelectSession(session.conversation_id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl transition-all group flex flex-col gap-1",
                      currentConversationId === session.conversation_id
                        ? "bg-card border border-zinc-200/60 dark:border-zinc-800 shadow-sm"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <span className={cn(
                        "text-xs font-bold truncate tracking-tight",
                        currentConversationId === session.conversation_id ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400"
                      )}>
                        {session.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSession(e, session.conversation_id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 transition-all ml-auto"
                        title="Delete conversation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {new Date(session.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-zinc-200/20">
              <div className="bg-blue-100/50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-widest mb-1">PRO TIP</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-300 leading-tight">Your chat history is encrypted and synced across all devices.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-thin min-h-0">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Start a conversation by asking a question below.
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCitationClick={handleCitationClick}
              />
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-zinc-950 dark:text-zinc-50 animate-spin" strokeWidth={1.5} />
              </div>
              <div className="bg-card border border-zinc-200/60 dark:border-zinc-800 rounded-2xl px-5 py-3.5 shadow-sm max-w-xs">
                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                  <span className="text-sm font-medium">Processing your request</span>
                  <span className="flex gap-1">
                    <span className="w-1 h-1 bg-zinc-950 dark:bg-zinc-50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-zinc-950 dark:bg-zinc-50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-zinc-950 dark:bg-zinc-50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Focused Document Indicator */}
        <AnimatePresence>
          {focusedDoc && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 lg:px-6 pb-2"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 text-xs shadow-sm">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="font-bold tracking-tight">Focusing on: {focusedDoc.name}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ml-2",
                  focusedDoc.status === 'VALID' ? "bg-green-100/50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" :
                    focusedDoc.status === 'FLAGGED' ? "bg-red-100/50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" :
                      "bg-zinc-100/50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                )}>
                  {focusedDoc.status}
                </span>
                <button
                  onClick={() => {
                    setSearchParams({});
                    setFocusedDoc(null);
                  }}
                  className="ml-auto p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggested Queries */}
        <AnimatePresence>
          {messages.length === 1 && !docId && !currentConversationId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="px-4 lg:px-6 pb-6"
            >
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-4 px-1 flex items-center gap-2 font-bold uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
                Try asking about
              </p>
              <div className="flex flex-wrap gap-2 px-1">
                {suggestedQueries.map((query) => (
                  <motion.button
                    key={query}
                    whileHover={{ y: -2 }}
                    onClick={() => handleSuggestionClick(query)}
                    className="text-xs px-4 py-2.5 rounded-xl bg-card border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {query}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Follow-up Suggestions */}
        <AnimatePresence>
          {followUpSuggestions.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="px-4 lg:px-6 pb-4"
            >
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-4 px-1 flex items-center gap-2 font-bold uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
                Follow-up suggestions
              </p>
              <div className="flex flex-wrap gap-2 px-1">
                {followUpSuggestions.map((query) => (
                  <motion.button
                    key={query}
                    whileHover={{ y: -2 }}
                    onClick={() => handleSuggestionClick(query)}
                    className="text-xs px-4 py-2.5 rounded-xl bg-card border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {query}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 lg:p-6 border-t border-zinc-200/60 dark:border-zinc-800 bg-background/80 backdrop-blur-md">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={focusedDoc ? `Ask about ${focusedDoc.name}...` : "Type a message..."}
                rows={1}
                className="w-full resize-none rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-card px-5 py-3 pr-12 text-[15px] focus:outline-none focus:ring-2 focus:ring-zinc-400 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:ring-2 text-foreground font-inter shadow-sm"
                style={{ maxHeight: '120px' }}
              />
            </div>
            <motion.div
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 flex items-center justify-center disabled:opacity-50 transition-all shadow-md active:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Send className="w-4 h-4" strokeWidth={2} />
                )}
              </Button>
            </motion.div>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 text-center font-bold uppercase tracking-widest opacity-60">
            ComplyFlow AI Assistant • Official GST Database
          </p>
        </div>
      </div>

      {/* Citation Panel */}
      <AnimatePresence>
        {selectedCitation && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-80 border-l border-zinc-200/60 dark:border-zinc-800 bg-card overflow-hidden"
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-zinc-950 dark:text-zinc-100">
                  <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-medium text-sm tracking-tight">Legal Reference</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCitation(null)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                </motion.button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4 pr-4">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 font-medium">Section</p>
                    <p className="font-medium text-zinc-950 dark:text-zinc-100">{selectedCitation.section}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 font-medium">Title</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedCitation.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 font-medium">Content</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{selectedCitation.content}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 font-medium">Source</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{selectedCitation.source}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
