import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AuthPage } from "@/components/auth/AuthPage";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function EnhancedSidebarTrigger() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <button
      onClick={toggleSidebar}
      className="group relative flex h-9 w-9 items-center justify-center rounded-md border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:bg-accent hover:border-accent/50 hover:shadow-glow/30 active:scale-95"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <div className="relative overflow-hidden">
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        )}
      </div>
      <div className="absolute inset-0 rounded-md bg-gradient-primary opacity-0 transition-opacity group-hover:opacity-10" />
    </button>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border/50 bg-card/30 backdrop-blur-sm px-4">
            <EnhancedSidebarTrigger />
          </header>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
