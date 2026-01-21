import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { User, Bot, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/services/api';

interface MessageBubbleProps {
  message: Message;
  onCitationClick?: (citationId: string) => void;
}

export function MessageBubble({ message, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const formattedTime = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center flex-none",
          isUser
            ? "bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950"
            : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 shadow-sm"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" strokeWidth={1.5} />
        ) : (
          <Bot className="w-4 h-4 text-zinc-950 dark:text-zinc-50" strokeWidth={1.5} />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-5 py-4 rounded-2xl shadow-sm prose prose-sm dark:prose-invert max-w-none",
            isUser
              ? "bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950"
              : "bg-card border border-zinc-200/60 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50"
          )}
        >
          {/* Message Text with Markdown Support */}
          <div className={cn(
            "text-[15px] leading-relaxed font-inter",
            "prose-h3:text-sm prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-wider prose-h3:mb-2 prose-h3:mt-4 first:prose-h3:mt-0",
            "prose-p:mb-3 last:prose-p:mb-0",
            "prose-li:list-disc prose-li:ml-4 prose-li:mb-1",
            isUser ? "prose-p:text-white dark:prose-p:text-zinc-950" : ""
          )}>
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Citations */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-300/50 dark:border-zinc-700/50">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                <BookOpen className="w-3 h-3" strokeWidth={2} />
                Legal References
              </p>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((citation) => (
                  <motion.button
                    key={citation.id}
                    whileHover={{ y: -1 }}
                    onClick={() => onCitationClick?.(citation.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors font-medium shadow-sm"
                  >
                    {citation.section}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-zinc-500 mt-2 px-1">
          {formattedTime}
        </span>
      </div>
    </motion.div>
  );
}
