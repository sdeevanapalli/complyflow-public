import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function Chat() {
  return (
    <>
      <Helmet>
        <title>AI GST Assistant - ComplyFlow</title>
        <meta name="description" content="Get instant answers to your GST compliance questions with ComplyFlow's AI-powered assistant. Backed by official legal provisions." />
      </Helmet>

      <div className="pt-16 lg:pt-20 h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-zinc-200/60 dark:border-zinc-800 bg-background/80 backdrop-blur-md"
        >
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-medium text-zinc-950 dark:text-zinc-50 tracking-tight">AI Compliance Assistant</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Ask questions about Indian GST laws and regulations</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="w-2 h-2 bg-zinc-950 dark:bg-zinc-100 rounded-full animate-pulse" />
                Online
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden bg-background">
          <div className="h-full max-w-5xl mx-auto">
            <ChatWindow />
          </div>
        </div>
      </div>
    </>
  );
}
