import { useState } from "react";
import { Search, BookOpen, Trash2, LogOut, User, Quote as QuoteIcon, Sparkles, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useQuotes, Quote } from "@/hooks/useQuotes";
import { useAuth } from "@/hooks/useAuth";


export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { quotes, loading, deleteQuote } = useQuotes(user?.id);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuotes = quotes.filter(quote =>
    quote.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteQuote = async (quote: Quote) => {
    if (window.confirm("Are you sure you want to delete this quote?")) {
      await deleteQuote(quote.id);
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-glass-border bg-glass/30 backdrop-blur-xl">
      <SidebarHeader className="p-6 border-b border-glass-border/50">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">My Quotes</h2>
              <p className="text-xs text-muted-foreground">Inspiration Library</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 space-y-6 flex-1">
          {!isCollapsed && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  variant="glass"
                  placeholder="Search your quotes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-sm"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          {!isCollapsed && (
            <div className="space-y-2">
              <Link to="/">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 text-foreground/80 hover:text-foreground hover:bg-glass/50 transition-all duration-200"
                >
                  <QuoteIcon className="h-4 w-4" />
                  Quote Generator
                </Button>
              </Link>
              <Link to="/flux">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 text-foreground/80 hover:text-foreground hover:bg-glass/50 transition-all duration-200"
                >
                  <Wand2 className="h-4 w-4" />
                  Flux Prompt Generator
                </Button>
              </Link>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <QuoteIcon className="h-4 w-4" />
                Saved Quotes
              </h3>
              <span className="text-xs text-muted-foreground bg-glass/50 px-2 py-1 rounded-full border border-glass-border">
                {filteredQuotes.length}
              </span>
            </div>

            <ScrollArea className="h-[420px] -mx-1">
              <div className="px-1 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                ) : filteredQuotes.length === 0 ? (
                  <Card variant="glass" className="p-6 text-center">
                    <QuoteIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {searchQuery ? "No quotes found" : "No quotes yet"}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {searchQuery ? "Try a different search term" : "Generate your first quote to get started"}
                    </p>
                  </Card>
                ) : (
                  filteredQuotes.map((quote) => (
                    <Card
                      key={quote.id}
                      variant="glass"
                      className="group relative p-4 hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className="space-y-3">
                        <blockquote className="text-sm leading-relaxed text-foreground/90 line-clamp-4 font-medium">
                          "{quote.content}"
                        </blockquote>
                        <div className="flex items-center justify-between">
                          <time className="text-xs text-muted-foreground/70 font-medium">
                            {new Date(quote.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </time>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteQuote(quote)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Subtle gradient overlay on hover */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Account info and sign out - properly positioned at bottom */}
        {!isCollapsed && (
          <div className="p-4 border-t border-glass-border/50 space-y-3">
            <Card variant="glass" className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-accent">
                  <User className="h-3.5 w-3.5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/80 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground/70">Premium User</p>
                </div>
              </div>
            </Card>


            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full justify-start gap-3 h-10 text-muted-foreground/80 hover:text-foreground hover:bg-glass/50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </SidebarContent>
      
    </Sidebar>
  );
}
