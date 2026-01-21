import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, ExternalLink, Sparkles, X, AlertCircle, ClipboardList, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, deleteNotification, API_BASE_URL, type GlobalNotification } from '@/services/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const [lastNotifiedId, setLastNotifiedId] = useState<number>(() => {
        const saved = localStorage.getItem('last_notified_id');
        return saved ? parseInt(saved, 10) : 0;
    });

    const fetchInitialDocs = async () => {
        try {
            const data = await getNotifications();
            if (data.length > 0) {
                setNotifications(data);
                const latestId = data[0].id;
                setLastNotifiedId(latestId);
                localStorage.setItem('last_notified_id', latestId.toString());
            }
        } catch (err) {
            console.error('Failed to fetch initial notifications:', err);
        }
    };

    useEffect(() => {
        // 1. Fetch historical notifications on mount
        fetchInitialDocs();

        // 2. Set up SSE for real-time updates
        let eventSource: EventSource;

        const connectSSE = () => {
            // Ensure no double slashes if API_BASE_URL ends with /
            const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            const streamUrl = `${baseUrl}/notifications/stream/`;

            eventSource = new EventSource(streamUrl);

            eventSource.onopen = () => {
                console.log('[SSE] Live notification stream connected');
            };

            eventSource.onmessage = (event) => {
                try {
                    const newDoc: GlobalNotification = JSON.parse(event.data);

                    // Update local state
                    setNotifications(prev => [newDoc, ...prev].slice(0, 10));
                    setUnreadCount(prev => prev + 1);

                    // Update persistent ID
                    setLastNotifiedId(newDoc.id);
                    localStorage.setItem('last_notified_id', newDoc.id.toString());

                    // Show toast
                    toast(newDoc.title, {
                        description: newDoc.message,
                        icon: <Bell className="w-4 h-4 text-blue-500" />,
                        action: {
                            label: "Discuss",
                            onClick: () => navigate(`/chat?discussDoc=${encodeURIComponent(newDoc.doc_name)}`)
                        },
                    });
                } catch (err) {
                    console.error('Error parsing SSE data:', err);
                }
            };

            eventSource.onerror = (err) => {
                console.warn('[SSE] Connection lost, retrying in 5s...', err);
                eventSource.close();
                setTimeout(connectSSE, 5000); // Silent retry
            };
        };

        connectSSE();

        return () => {
            if (eventSource) eventSource.close();
        };
    }, [navigate]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
        }
    };

    const handleDiscuss = (docName: string) => {
        setIsOpen(false);
        navigate(`/chat?discussDoc=${encodeURIComponent(docName)}`);
    };

    const handleDismiss = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            const success = await deleteNotification(id);
            if (success) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            } else {
                toast.error("Failed to dismiss notification. Please try again.");
            }
        } catch (err) {
            console.error('Error in handleDismiss:', err);
            toast.error("An error occurred while dismissing the notification.");
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleOpen}
                className="relative rounded-full w-10 h-10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <Bell className="w-5 h-5" strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-card border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Notifications</h3>
                            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                        </div>

                        <div className="max-h-[400px] overflow-y-auto scrollbar-none">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs text-zinc-500">No updates yet. We'll notify you when new laws are detected.</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50 truncate flex-1">
                                                        {n.title}
                                                    </p>
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                                        n.impact_level === 'HIGH' ? "bg-red-100 text-red-600 dark:bg-red-950/40" :
                                                            n.impact_level === 'MEDIUM' ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40" :
                                                                "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"
                                                    )}>
                                                        {n.impact_level}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight mb-2">
                                                    {n.message}
                                                </p>

                                                {n.action_draft && (
                                                    <div className="mb-3 p-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                                                <ClipboardList className="w-3 h-3" />
                                                                AI Action Plan
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(n.action_draft || '');
                                                                    toast.success('Action plan copied to clipboard');
                                                                }}
                                                                className="p-1 hover:bg-white dark:hover:bg-zinc-800 rounded transition-colors"
                                                            >
                                                                <Copy size={10} className="text-zinc-400" />
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed italic">
                                                            "{n.action_draft}"
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleDiscuss(n.doc_name)}
                                                        className="h-8 rounded-lg text-[11px] gap-1.5 font-bold"
                                                    >
                                                        <MessageSquare className="w-3 h-3" />
                                                        Discuss
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => handleDismiss(e, n.id)}
                                                        className="h-8 rounded-lg text-[11px] gap-1.5 font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Dismiss
                                                    </Button>
                                                    {n.source_url?.startsWith('http') && (
                                                        <a
                                                            href={n.source_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center rounded-lg px-2 h-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 text-center">
                            <p className="text-[10px] text-zinc-400 font-medium">Monitoring Google Drive & CBIC Portal</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
