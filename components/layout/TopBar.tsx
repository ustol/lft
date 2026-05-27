"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { usePendingConnectionCount, useRealtimeConnections } from "@/lib/hooks/useConnections";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tree": "Family Tree",
  "/connections": "Connections",
  "/connections/search": "Find People",
  "/settings": "Settings",
  "/settings/privacy": "Privacy",
  "/settings/account": "Account",
  "/person/new": "Add Person",
};

interface TopBarProps {
  userId: string;
  initialPendingCount?: number;
}

export function TopBar({ userId, initialPendingCount = 0 }: TopBarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Lotsu Family Tree";

  // Realtime subscription keeps the count fresh across all pages
  useRealtimeConnections(userId);

  const { data: pendingCount = initialPendingCount } =
    usePendingConnectionCount(userId);

  return (
    <header className="fixed top-0 left-16 lg:left-64 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-4 lg:px-6">
      <h1 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Global search shortcut */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl text-muted-foreground text-sm border-border/60 hover:border-border"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl h-9 w-9"
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 flex items-center justify-center text-[10px] rounded-full"
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
