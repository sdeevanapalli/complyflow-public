import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getQueryHistory, getDocuments, deleteDocument, type ComplianceQuery, type UploadedDocument } from '@/services/api';
import { cn } from '@/lib/utils';

const complianceStats = [
  {
    title: 'Total Queries',
    value: '128',
    change: '+12%',
    icon: MessageSquare,
    color: 'text-complyflow-indigo',
    bgColor: 'bg-complyflow-indigo/10',
  },
  {
    title: 'Documents Processed',
    value: '45',
    change: '+8%',
    icon: FileText,
    color: 'text-complyflow-teal',
    bgColor: 'bg-complyflow-teal/10',
  },
  {
    title: 'Compliance Score',
    value: '94%',
    change: '+2%',
    icon: TrendingUp,
    color: 'text-complyflow-success',
    bgColor: 'bg-complyflow-success/10',
  },
  {
    title: 'Avg. Response Time',
    value: '1.2s',
    change: '-15%',
    icon: Clock,
    color: 'text-complyflow-warning',
    bgColor: 'bg-complyflow-warning/10',
  },
];

const getUpcomingDeadlines = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Helper to format date
  const formatDate = (day: number, month: number, year: number) => {
    return new Date(year, month, day).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // GSTR-1: 11th of next month for current month's transactions
  // or 11th of current month if before 11th
  let gstr1Date = new Date(currentYear, currentMonth, 11);
  if (now > gstr1Date) {
    gstr1Date = new Date(currentYear, currentMonth + 1, 11);
  }

  // GSTR-3B: 20th of next month
  let gstr3bDate = new Date(currentYear, currentMonth, 20);
  if (now > gstr3bDate) {
    gstr3bDate = new Date(currentYear, currentMonth + 1, 20);
  }

  return [
    {
      title: 'GSTR-1 Filing',
      date: gstr1Date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'upcoming'
    },
    {
      title: 'GSTR-3B Filing',
      date: gstr3bDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'upcoming'
    },
    {
      title: 'Annual Return',
      date: `Dec 31, ${currentYear}`,
      status: 'warning'
    },
  ];
};

export default function Dashboard() {
  const [queries, setQueries] = useState<ComplianceQuery[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const data = await getQueryHistory();
      setQueries(data);
    } catch (error) {
      console.error('Error fetching query history:', error);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const success = await deleteDocument(id);
      if (success) {
        toast.success('Document deleted successfully');
        fetchDocuments(); // Refresh list
      } else {
        toast.error('Failed to delete document');
      }
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchDocuments();
  }, []);

  const filteredQueries = queries.filter(q =>
    q.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate real-time stats
  const totalQueries = queries.length;
  const docsProcessed = documents.length;
  const validDocs = documents.filter(d => d.status === 'VALID').length;
  const complianceScore = docsProcessed > 0 ? Math.round((validDocs / docsProcessed) * 100) : 100;

  const stats = [
    {
      title: 'Total Queries',
      value: totalQueries.toString(),
      change: totalQueries > 0 ? '+100%' : '0%',
      icon: MessageSquare,
    },
    {
      title: 'Documents Processed',
      value: docsProcessed.toString(),
      change: docsProcessed > 0 ? '+100%' : '0%',
      icon: FileText,
    },
    {
      title: 'Compliance Score',
      value: `${complianceScore}%`,
      change: complianceScore > 90 ? '+2%' : '-1%',
      icon: TrendingUp,
    },
    {
      title: 'Avg. Response Time',
      value: '0.8s',
      change: '-20%',
      icon: Clock,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - ComplyFlow</title>
        <meta name="description" content="View your GST compliance dashboard, query history, and upcoming deadlines." />
      </Helmet>

      <div className="pt-20 lg:pt-24 pb-12 min-h-screen bg-background text-foreground transition-colors duration-300">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12"
          >
            <div>
              <h1 className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tighter mb-2">Compliance Dashboard</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-inter">Track your GST compliance status and query history</p>
            </div>
            <Link to="/chat">
              <Button className="bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 rounded-xl text-sm font-bold px-8 py-3 h-auto shadow-lg shadow-zinc-950/10 dark:shadow-white/5 transition-all">
                <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                New Query
              </Button>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -2 }}
                className="p-8 rounded-[1.5rem] bg-card border border-zinc-200/60 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-zinc-950/5 dark:hover:shadow-white/5 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <stat.icon className="w-5 h-5 text-zinc-950 dark:text-zinc-50" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full uppercase tracking-wider">
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 mb-1 tracking-tighter">{stat.value}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold tracking-widest uppercase">{stat.title}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Uploads Table */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="rounded-[1.5rem] bg-card border border-zinc-200/60 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="p-4 lg:p-6 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50 tracking-tight">Recent Document Uploads</h2>
                    <Link to="/upload">
                      <Button variant="outline" size="sm" className="text-xs border-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800">Upload New</Button>
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                          <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">File Name</th>
                          <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Uploaded</th>
                          <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">AI Verdict</th>
                          <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {isLoading ? (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">Loading documents...</td></tr>
                        ) : documents.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">No documents found</td></tr>
                        ) : (
                          documents.slice(0, 5).map((doc) => (
                            <tr key={doc.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                                    <FileText size={18} strokeWidth={1.5} />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate max-w-[120px] lg:max-w-[200px]">{doc.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-zinc-500">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                  doc.status === 'VALID'
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                    : doc.status === 'PENDING'
                                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                                )}>
                                  {doc.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link to={`/chat?docId=${doc.id}`}>
                                    <Button variant="ghost" size="sm" className="text-xs h-8 gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                      <MessageSquare size={14} /> Discuss
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-xs h-8 gap-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* Query History */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="rounded-2xl bg-card border border-zinc-200/60 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 lg:p-6 border-b border-zinc-200/60 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50 tracking-tight">Recent Queries</h2>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                        <input
                          type="text"
                          placeholder="Search queries..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-400 w-full sm:w-64 focus-visible:ring-2 ring-zinc-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
                    {isLoading ? (
                      <div className="p-8 text-center text-zinc-500 text-sm">Loading...</div>
                    ) : filteredQueries.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 text-sm">No queries found</div>
                    ) : (
                      filteredQueries.map((query) => (
                        <motion.div
                          key={query.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 lg:p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {query.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-zinc-950 flex-shrink-0" strokeWidth={1.5} />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
                                )}
                                <h3 className="font-medium text-sm text-zinc-950 truncate">{query.query}</h3>
                              </div>
                              <p className="text-xs text-zinc-500 line-clamp-2">{query.response}</p>
                            </div>
                            <div className="text-xs text-zinc-500 whitespace-nowrap">
                              {new Date(query.timestamp).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800">
                    <Button variant="ghost" className="w-full gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 rounded-lg text-sm font-medium">
                      View All History
                      <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Deadlines */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-[1.5rem] bg-card border border-zinc-200/60 dark:border-zinc-800 p-8 shadow-sm hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-6 tracking-tight">Upcoming Deadlines</h3>
                <div className="space-y-6">
                  {getUpcomingDeadlines().map((deadline) => (
                    <div key={deadline.title} className="group flex items-start gap-4">
                      <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-zinc-950 dark:bg-zinc-50" />
                      <div>
                        <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50 mb-1 leading-tight group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors">
                          {deadline.title}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold mb-1">{deadline.date}</div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest">{deadline.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl bg-zinc-950 text-white p-6 border border-zinc-800/50"
              >
                <h3 className="font-medium text-white mb-2 tracking-tight">Need Help?</h3>
                <p className="text-sm text-white/60 mb-4 leading-relaxed">
                  Our AI assistant is ready to help with your GST queries.
                </p>
                <Link to="/chat">
                  <Button className="bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium w-full">
                    Ask a Question
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
