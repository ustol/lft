"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, User, Clock, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useApproveConnection,
  useRejectConnection,
  type EnrichedConnection,
} from "@/lib/hooks/useConnections";
import { usePersons } from "@/lib/hooks/usePersons";
import { cn } from "@/lib/utils";

const REL_LABELS: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  brother: "Brother",
  sister: "Sister",
  son: "Son",
  daughter: "Daughter",
};

interface IncomingRequestCardProps {
  connection: EnrichedConnection;
  userId: string;
}

export function IncomingRequestCard({
  connection,
  userId,
}: IncomingRequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [targetPersonId, setTargetPersonId] = useState("");

  const { data: myPersons = [] } = usePersons(userId);
  const approve = useApproveConnection(userId);
  const reject = useRejectConnection(userId);

  const requester = connection.requester;
  const timeAgo = formatDistanceToNow(new Date(connection.created_at), {
    addSuffix: true,
  });

  function handleApprove() {
    if (!targetPersonId || !connection.requester_person_id) return;
    approve.mutate({
      connectionId: connection.id,
      targetPersonId,
      requesterPersonId: connection.requester_person_id,
      relationship: connection.relationship,
      requesterId: connection.requester_id,
    });
  }

  function handleReject() {
    reject.mutate({ connectionId: connection.id, action: "rejected" });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-border bg-card p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {requester?.avatar_url ? (
          <Image
            src={requester.avatar_url}
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
          <p className="font-semibold text-sm">
            {requester?.display_name ?? "Unknown"}
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            {requester?.lftid}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {connection.requester_person_name ? (
              <>
                <span className="font-medium text-foreground">
                  {connection.requester_person_name}
                </span>{" "}
                wants to connect as your{" "}
              </>
            ) : (
              "Wants to connect as your "
            )}
            <span className="font-medium text-foreground">
              {REL_LABELS[connection.relationship] ?? connection.relationship}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 mt-0.5">
          <Clock className="w-3 h-3" />
          <span className="hidden sm:inline">{timeAgo}</span>
        </div>
      </div>

      {/* Optional message */}
      {connection.message && (
        <div className="bg-muted/50 rounded-xl px-3 py-2 text-xs text-muted-foreground italic">
          &ldquo;{connection.message}&rdquo;
        </div>
      )}

      {/* Expand: pick which person in your tree to link */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Connect to which person in your tree?
              </Label>
              <select
                value={targetPersonId}
                onChange={(e) => setTargetPersonId(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
              >
                <option value="">Choose a person…</option>
                {myPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.surname}
                    {p.is_self ? " (You)" : ""}
                  </option>
                ))}
              </select>

              {approve.error && (
                <p className="text-xs text-destructive">
                  {(approve.error as Error).message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          disabled={reject.isPending || approve.isSuccess}
          className="rounded-xl gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        >
          {reject.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          Decline
        </Button>

        {!expanded ? (
          <Button
            size="sm"
            onClick={() => setExpanded(true)}
            className="flex-1 rounded-xl lft-gradient text-white border-0 gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Approve
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={!targetPersonId || approve.isPending}
            className="flex-1 rounded-xl lft-gradient text-white border-0 gap-1.5"
          >
            {approve.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Confirm
          </Button>
        )}
      </div>
    </motion.div>
  );
}
