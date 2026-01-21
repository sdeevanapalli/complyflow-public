import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle2, Mail, Linkedin, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background border-t border-zinc-200/60 dark:border-zinc-800 transition-colors duration-300">
      {/* Trust Badges */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-800">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
            {[
              { icon: Shield, label: 'Enterprise-Grade Security' },
              { icon: Lock, label: '256-bit Encryption' },
              { icon: CheckCircle2, label: 'SOC 2 Compliant' },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 text-sm"
              >
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <item.icon className="w-5 h-5 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="col-span-2 md:col-span-1"
          >
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white dark:text-zinc-950" strokeWidth={1.5} />
              </div>
              <span className="font-medium text-lg text-zinc-950 dark:text-zinc-100 tracking-tight">
                ComplyFlow
              </span>
            </Link>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed max-w-prose">
              AI-powered GST compliance assistant for Indian enterprises. Making tax laws understandable.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Twitter, label: 'Twitter' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Mail, label: 'Email' },
              ].map((item) => (
                <motion.a
                  key={item.label}
                  href="#"
                  whileHover={{ y: -2, scale: 1.05 }}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label={item.label}
                >
                  <item.icon className="w-4 h-4 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-medium mb-4 text-zinc-950 dark:text-zinc-100 text-sm tracking-tight">Product</h4>
            <ul className="space-y-3 text-xs">
              <li><Link to="/chat" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">AI Assistant</Link></li>
              <li><Link to="/dashboard" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Dashboard</Link></li>
              <li><Link to="/upload" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Document Upload</Link></li>
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Pricing</a></li>
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-medium mb-4 text-zinc-950 dark:text-zinc-100 text-sm tracking-tight">Resources</h4>
            <ul className="space-y-3 text-xs">
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">GST Guide</a></li>
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">API Reference</a></li>
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Blog</a></li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-medium mb-4 text-zinc-950 dark:text-zinc-100 text-sm tracking-tight">Legal</h4>
            <ul className="space-y-3 text-xs">
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Security</a></li>
              <li><a href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Compliance</a></li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-200/60 dark:border-zinc-800">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <p>© {new Date().getFullYear()} ComplyFlow. All rights reserved.</p>
            <p>Made with ❤️ for Indian Enterprises</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
