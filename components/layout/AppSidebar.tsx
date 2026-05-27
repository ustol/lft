"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  GitBranch,
  Users,
  Settings,
  LogOut,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRow } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/tree", icon: GitBranch, label: "Family Tree" },
  { href: "/connections", icon: Users, label: "Connections" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface AppSidebarProps {
  user: UserRow;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);

  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function copyLFTID() {
    navigator.clipboard.writeText(user.lftid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-16 lg:w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 flex-shrink-0 rounded-xl lft-gradient flex items-center justify-center shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M12 22v-7" />
            <path d="M9 8c0 0-4 1-4 6h14c0-5-4-6-4-6" />
            <path d="M7 8c0-4 5-6 5-6s5 2 5 6" />
            <path d="M9 22H6" />
            <path d="M18 22h-3" />
          </svg>
        </div>
        <span className="hidden lg:block font-display text-sidebar-foreground font-semibold tracking-tight truncate">
          Lotsu
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <Link
                    href={href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  />
                }
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-sidebar-primary rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:block truncate">{label}</span>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {/* LFTID badge */}
        <button
          onClick={copyLFTID}
          className="hidden lg:flex w-full items-center justify-between px-3 py-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-sidebar-foreground/50 font-mono uppercase tracking-wider">
              ID
            </span>
            <span className="text-xs font-mono text-sidebar-foreground/80 truncate">
              {user.lftid}
            </span>
          </div>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-lft-forest flex-shrink-0" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 flex-shrink-0" />
          )}
        </button>

        {/* User avatar + sign out */}
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-sidebar-border">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-semibold lft-gradient text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {user.display_name}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                />
              }
            >
              <LogOut className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
