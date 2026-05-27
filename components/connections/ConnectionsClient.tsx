"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { UserPlus, Inbox, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IncomingRequestCard } from "./IncomingRequestCard";
import { OutgoingRequestCard } from "./OutgoingRequestCard";
import {
  useIncomingConnections,
  useOutgoingConnections,
  useRealtimeConnections,
} from "@/lib/hooks/useConnections";
import { cn } from "@/lib/utils";

type Tab = "incoming" | "outgoing";

interface ConnectionsClientProps {
  userId: string;
}

export function ConnectionsClient({ userId }: ConnectionsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("incoming");

  useRealtimeConnections(userId);

  const incoming = useIncomingConnections(userId);
  const outgoing = useOutgoingConnections(userId);

  const pendingIncoming = incoming.data?.filter((c) => c.status === "pending") ?? [];
  const allIncoming = incoming.data ?? [];
  const allOutgoing = outgoing.data ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-slide-up max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Connections</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your family tree connections
          </p>
        </div>
        <Link href="/connections/search">
          <Button className="rounded-xl gap-2 lft-gradient text-white border-0">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Connect a tree</span>
            <span className="sm:hidden">Connect</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        <TabButton
          active={activeTab === "incoming"}
          onClick={() => setActiveTab("incoming")}
          icon={<Inbox className="w-3.5 h-3.5" />}
          label="Received"
          count={pendingIncoming.length}
        />
        <TabButton
          active={activeTab === "outgoing"}
          onClick={() => setActiveTab("outgoing")}
          icon={<Send className="w-3.5 h-3.5" />}
          label="Sent"
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "incoming" && (
          <motion.div
            key="incoming"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {incoming.isLoading ? (
              <LoadingState />
            ) : allIncoming.length === 0 ? (
              <EmptyState
                icon="📬"
                title="No incoming requests"
                description="When someone sends you a connection request, it will appear here."
              />
            ) : (
              <AnimatePresence>
                {allIncoming.map((conn) => (
                  <IncomingRequestCard
                    key={conn.id}
                    connection={conn}
                    userId={userId}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {activeTab === "outgoing" && (
          <motion.div
            key="outgoing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {outgoing.isLoading ? (
              <LoadingState />
            ) : allOutgoing.length === 0 ? (
              <EmptyState
                icon="📤"
                title="No sent requests"
                description="Requests you send will appear here. Search for a user by their LFTID to get started."
                action={
                  <Link href="/connections/search">
                    <Button variant="outline" size="sm" className="rounded-xl mt-3">
                      Find by LFTID
                    </Button>
                  </Link>
                }
              />
            ) : (
              <AnimatePresence>
                {allOutgoing.map((conn) => (
                  <OutgoingRequestCard
                    key={conn.id}
                    connection={conn}
                    userId={userId}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
        active
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
      {count != null && count > 0 && (
        <Badge
          variant="destructive"
          className="w-4 h-4 p-0 flex items-center justify-center text-[10px] rounded-full"
        >
          {count > 9 ? "9+" : count}
        </Badge>
      )}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-display font-semibold text-base">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      {action}
    </div>
  );
}
