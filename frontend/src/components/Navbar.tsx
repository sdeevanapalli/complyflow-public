import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageSquare, LayoutDashboard, Upload, Shield, User, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { NotificationBell } from './NotificationBell';

const navLinks = [
  { href: '/', label: 'Home', icon: null },
  { href: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('google_token');
    setIsLoggedIn(!!token);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLoginSuccess = (response: any) => {
    console.log('Login Success:', response);
    if (response.credential) {
      localStorage.setItem('google_token', response.credential);
      setIsLoggedIn(true);
      window.location.reload(); // Reload to refresh all components with new auth state
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
  };

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('google_token');
    setIsLoggedIn(false);
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800 transition-colors duration-300">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-lg bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center transition-colors">
              <Shield className="w-5 h-5 text-white dark:text-zinc-950" strokeWidth={1.5} />
            </div>
            <span className="font-medium text-lg text-zinc-950 dark:text-zinc-50 tracking-tight">
              ComplyFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-lg text-sm font-medium gap-2 transition-colors",
                    isActive(link.href)
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-50"
                  )}
                >
                  {link.icon && <link.icon className="w-4 h-4" strokeWidth={1.5} />}
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth Button */}
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Sun className="w-5 h-5" strokeWidth={1.5} />
            )}
          </Button>

          {isLoggedIn && <NotificationBell />}

          {!isLoggedIn ? (
            <div className="dark:invert dark:grayscale transition-all">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                useOneTap
                theme="outline"
                shape="pill"
              />
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-lg text-sm font-medium gap-2 border-zinc-200 dark:border-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-950 dark:text-zinc-100"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
        </button>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-zinc-200/60 dark:border-zinc-800 bg-background"
            >
              <div className="flex flex-col gap-2 pt-4 pb-4 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 rounded-lg text-sm font-medium",
                        isActive(link.href)
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      {link.icon && <link.icon className="w-4 h-4" strokeWidth={1.5} />}
                      {link.label}
                    </Button>
                  </Link>
                ))}

                <div className="pt-2 px-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 font-inter">Appearance</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {theme === 'light' ? (
                      <Moon className="w-5 h-5" strokeWidth={1.5} />
                    ) : (
                      <Sun className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </Button>
                </div>

                <div className="pt-2 px-1">
                  {!isLoggedIn ? (
                    <div className="flex justify-center p-2 dark:invert dark:grayscale transition-all">
                      <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onError={handleLoginError}
                        theme="outline"
                        shape="pill"
                      />
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full justify-start gap-2 rounded-lg text-sm font-medium border-zinc-200 dark:border-zinc-800 dark:text-zinc-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
