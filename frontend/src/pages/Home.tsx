import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Shield,
  Zap,
  BookOpen,
  History,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description: 'Get instant answers to GST queries through conversational AI that understands context and provides accurate guidance.',
  },
  {
    icon: FileText,
    title: 'Document Processing',
    description: 'Upload invoices, returns, and documents. Our AI extracts and validates GST compliance data automatically.',
  },
  {
    icon: BookOpen,
    title: 'Legal Citations',
    description: 'Every response is backed by specific sections of CGST/SGST Acts with direct references to official provisions.',
  },
  {
    icon: History,
    title: 'Audit Trail',
    description: 'Complete history of all queries and compliance checks for regulatory requirements and internal audits.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, SOC 2 compliance, and role-based access control for sensitive financial data.',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Stay current with the latest GST notifications, circulars, and amendments as they are released.',
  },
];

const stats = [
  { value: '50K+', label: 'Queries Resolved' },
  { value: '99.9%', label: 'Accuracy Rate' },
  { value: '500+', label: 'Enterprise Clients' },
  { value: '24/7', label: 'Availability' },
];

const useCases = [
  {
    icon: Building2,
    title: 'Enterprise Finance Teams',
    description: 'Streamline GST compliance across multiple entities and states.',
  },
  {
    icon: Users,
    title: 'CA Firms & Accountants',
    description: 'Handle client queries faster with AI-powered assistance.',
  },
  {
    icon: TrendingUp,
    title: 'Growing Startups',
    description: 'Navigate GST complexities without dedicated tax experts.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, currentColor 0.5px, transparent 0.5px)', backgroundSize: '70px 70px' }} />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200/60 dark:border-zinc-800 bg-card text-zinc-950 dark:text-zinc-100 text-xs font-medium mb-8"
            >
              <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
              AI-Powered GST Compliance for India
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] text-zinc-950 dark:text-zinc-50 mb-8 text-balance tracking-tighter"
            >
              Making GST Laws{' '}
              <span className="text-zinc-500/80 dark:text-zinc-500">Understandable</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 text-balance leading-relaxed"
            >
              ComplyFlow is your intelligent compliance partner. Ask questions in plain English, upload documents, and get accurate GST guidance backed by official legal provisions.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link to="/chat">
                <Button className="bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:opacity-90 rounded-lg text-sm font-medium px-8 py-3 gap-2 h-auto shadow-lg shadow-zinc-950/10 dark:shadow-white/5 transition-all">
                  Start Free Consultation
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button className="bg-transparent text-zinc-950 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium px-8 py-3 border border-zinc-200/60 dark:border-zinc-800 h-auto transition-all">
                  View Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-6 mt-12 text-xs text-zinc-500 dark:text-zinc-400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                GSTN Verified Sources
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                Enterprise Ready
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-24 border-y border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-left"
              >
                <div className="text-3xl md:text-4xl font-medium text-zinc-950 dark:text-zinc-50 mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32" id="features">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-950 dark:text-zinc-50 mb-6 text-balance tracking-tighter">
              Why Choose ComplyFlow?
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed font-inter">
              Built for Indian enterprises that need reliable, fast, and compliant GST assistance.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="group p-10 rounded-[2rem] bg-card border border-zinc-200/60 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-zinc-950/5 dark:hover:shadow-white/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-8 group-hover:bg-zinc-950 dark:group-hover:bg-white transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-zinc-950 dark:text-zinc-100 group-hover:text-white dark:group-hover:text-zinc-950 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-100 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-inter">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 lg:py-32 bg-zinc-50/50 dark:bg-zinc-900/30 border-y border-zinc-200/60 dark:border-zinc-800">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-medium text-zinc-950 dark:text-zinc-50 mb-4 text-balance tracking-tight">
              Built for Every Team
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
              From startups to large enterprises, ComplyFlow adapts to your compliance needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -2 }}
                className="text-center p-8 rounded-2xl bg-card border border-zinc-200/60 dark:border-zinc-800 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                  <useCase.icon className="w-6 h-6 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-zinc-950 dark:text-zinc-100 mb-3 tracking-tight">{useCase.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-zinc-950 text-white p-8 md:p-12 lg:p-16 relative overflow-hidden border border-zinc-800/50"
          >
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 0.5px, transparent 0.5px)', backgroundSize: '50px 50px' }} />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 text-balance tracking-tight">
                Ready to Simplify GST Compliance?
              </h2>
              <p className="text-white/60 mb-8 text-base leading-relaxed">
                Join hundreds of Indian enterprises already using ComplyFlow to navigate GST laws with confidence.
              </p>
              <Link to="/chat">
                <Button className="bg-white dark:bg-zinc-100 text-zinc-950 dark:text-zinc-950 hover:bg-zinc-100 dark:hover:bg-white rounded-lg text-sm font-medium px-6 py-2.5 gap-2 transition-colors">
                  Get Started for Free
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
