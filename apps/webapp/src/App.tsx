import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Capacitor } from '@capacitor/core';
import { TraktImport } from "./pages/import/TraktvComponent";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminGuard = lazy(() => import("./pages/AdminGuard").then(module => ({ default: module.AdminGuard })));
const Analytics = lazy(() => import("./pages/Analytics"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Import = lazy(() => import("./pages/import/Import"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const MovieDetail = lazy(() => import("./pages/MovieDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();
const isNativePlatform = Capacitor.isNativePlatform();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/import" element={<Import />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/trakt-import" element={<TraktImport />} />
                <Route path="/trakt-callback" element={<TraktImport />} />
                {!isNativePlatform && (
                  <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
                )}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
};

export default App;

