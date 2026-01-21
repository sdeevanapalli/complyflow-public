import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./context/ThemeContext";

const queryClient = new QueryClient();

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function AppLayout() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isChatPage && <Footer />}
    </div>
  );
}

const App = () => (
  <HelmetProvider>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </HelmetProvider>
);

export default App;
