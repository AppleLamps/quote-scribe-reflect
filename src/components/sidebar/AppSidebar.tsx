import { useState } from "react";
import { Search, BookOpen, Trash2, LogOut, User } from "lucide-react";
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
    <Sidebar className={isCollapsed ? "w-14" : "w-80"} collapsible="offcanvas">
      <SidebarHeader>
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">My Quotes</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Search</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-background/50 border-border/50"
                  />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>
            Saved Quotes ({filteredQuotes.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[400px] px-2">
              {loading ? (
                <div className="text-sm text-muted-foreground p-2">
                  Loading quotes...
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2">
                  {searchQuery ? "No quotes found." : "No saved quotes yet."}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="group relative p-3 rounded-md bg-card/50 border border-border/30 hover:bg-card/70 transition-colors"
                    >
                      <blockquote className="text-sm italic leading-relaxed text-foreground line-clamp-3">
                        "{quote.content}"
                      </blockquote>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={() => handleDeleteQuote(quote)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {user?.email}
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}