"use client";

import { motion } from "framer-motion";
import { X, User, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useRejectConnection,
  type EnrichedConnection,
} from "@/lib/hooks/useConnections";

const REL_LABELS: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  brother: "Brother",
  sister: "Sister",
  son: "Son",
  daughter: "Daughter",
};

interface OutgoingRequestCardProps {
  connection: EnrichedConnection;
  userId: string;
}

export function OutgoingRequestCard({
  connection,
  userId,
}: OutgoingRequestCardProps) {
  const reject = useRejectConnection(userId);
  const target = connection.target;
  const timeAgo = formatDistanceToNow(new Date(connection.created_at), {
    addSuffix: true,
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        {target?.avatar_url ? (
          <Image
            src={target.avatar_url}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-background flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full lft-gradient flex items-center justify-center ring-2 ring-background flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">
              {target?.display_name ?? "Unknown"}
            </p>
            <StatusBadge status={connection.status} />
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            {target?.lftid}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {connection.requester_person_name ? (
              <>
                <span className="font-medium text-foreground">
                  {connection.requester_person_name}
                </span>{" "}
                as their{" "}
              </>
            ) : (
              "Sent as their "
            )}
            <span className="font-medium text-foreground">
              {REL_LABELS[connection.relationship] ?? connection.relationship}
            </span>
          </p>
          {connection.message && (
            <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
              &ldquo;{connection.message}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">{timeAgo}</span>
          </div>
          {connection.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                reject.mutate({
                  connectionId: connection.id,
                  action: "cancelled",
                })
              }
              disabled={reject.isPending}
              title="Cancel request"
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              {reject.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return (
      <Badge
        variant="outline"
        className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-[10px] px-1.5 py-0"
      >
        Pending
      </Badge>
    );
  if (status === "approved")
    return (
      <Badge
        variant="outline"
        className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-[10px] px-1.5 py-0 gap-1"
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
        Approved
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge
        variant="outline"
        className="text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/30 text-[10px] px-1.5 py-0 gap-1"
      >
        <XCircle className="w-2.5 h-2.5" />
        Declined
      </Badge>
    );
  return null;
}
