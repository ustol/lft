"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Pencil, Link2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { lifeSpan } from "@/lib/utils/dateUtils";
import { useTreeStore } from "@/lib/stores/treeStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { NODE_WIDTH, NODE_HEIGHT } from "@/lib/tree/layoutEngine";
import type { PersonNodeData } from "@/types/tree";

export const PersonNode = memo(function PersonNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = data as PersonNodeData;
  const router = useRouter();
  const { pendingRelationshipFrom, setPendingRelationshipFrom, setSelectedPerson } =
    useTreeStore();
  const { openPersonModal } = useUIStore();

  const isDeceased = nodeData.status === "deceased";
  const isSelf = nodeData.isSelf;
  const isConnected = nodeData.isConnected;
  const isConnecting = !!pendingRelationshipFrom;
  const isConnectSource = pendingRelationshipFrom === nodeData.personId;
  const span = lifeSpan(nodeData.dateOfBirth, nodeData.dateOfDeath);

  const handleClick = useCallback(() => {
    if (isConnecting && !isConnectSource) {
      setSelectedPerson(nodeData.personId);
      return;
    }
    openPersonModal(nodeData.personId);
  }, [isConnecting, isConnectSource, nodeData.personId, openPersonModal, setSelectedPerson]);

  const handleConnectStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPendingRelationshipFrom(
        pendingRelationshipFrom === nodeData.personId ? null : nodeData.personId
      );
    },
    [nodeData.personId, pendingRelationshipFrom, setPendingRelationshipFrom]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/person/${nodeData.personId}/edit`);
    },
    [nodeData.personId, router]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={handleClick}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={cn(
        "relative flex flex-col rounded-2xl border cursor-pointer select-none group overflow-visible",
        "backdrop-blur-md transition-shadow duration-200",
        isConnected
          ? "bg-violet-50/80 dark:bg-violet-950/40"
          : "bg-white/80 dark:bg-stone-900/80",
        selected || isConnectSource
          ? "border-primary shadow-[0_0_0_2px_oklch(0.65_0.15_60/0.4)] node-shadow-hover"
          : isConnected
          ? "border-violet-300/60 dark:border-violet-700/50 node-shadow hover:node-shadow-hover"
          : "border-white/60 dark:border-stone-700/50 node-shadow hover:node-shadow-hover",
        isConnecting && !isConnectSource && "hover:border-primary/60 hover:ring-2 hover:ring-primary/30",
        isSelf && !isConnected && "border-primary/40"
      )}
    >
      {/* Self badge */}
      {isSelf && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase z-10">
          You
        </span>
      )}

      {/* Connected tree badge */}
      {isConnected && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase z-10 flex items-center gap-1">
          <ExternalLink className="w-2.5 h-2.5" />
          Connected
        </span>
      )}

      {/* Connecting indicator */}
      {isConnectSource && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide z-10"
        >
          Connecting…
        </motion.div>
      )}

      {/* Status ring */}
      <span
        className={cn(
          "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-stone-900 z-10",
          isDeceased ? "status-deceased" : "status-alive"
        )}
      />

      {/* Card body */}
      <div className="flex items-start gap-3 p-3 flex-1">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <PersonNodeAvatar
            firstName={nodeData.firstName}
            surname={nodeData.surname}
            photoUrl={nodeData.primaryPhotoUrl}
            isConnected={isConnected}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-display font-semibold text-[13px] leading-tight text-stone-900 dark:text-stone-50 truncate">
            {nodeData.firstName}
          </p>
          <p className="font-display font-semibold text-[13px] leading-tight text-stone-900 dark:text-stone-50 truncate">
            {nodeData.surname}
          </p>
          {span && (
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 tabular-nums">
              {span}
            </p>
          )}
          {nodeData.placeOfBirth && (
            <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
              📍 {nodeData.placeOfBirth.split(",")[0]}
            </p>
          )}
        </div>
      </div>

      {/* LFTID footer */}
      <div className="px-3 pb-2.5">
        <p className="text-[9px] font-mono text-stone-400 dark:text-stone-600 tracking-wider">
          {nodeData.lftid}
        </p>
      </div>

      {/* Hover action buttons */}
      <div
        className={cn(
          "absolute -bottom-9 left-1/2 -translate-x-1/2 flex gap-1.5",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto z-20"
        )}
      >
        {/* Only own-tree nodes can be used as connection sources */}
        {!isConnected && (
          <ActionButton
            icon={<Link2 className="w-3 h-3" />}
            onClick={handleConnectStart}
            active={isConnectSource}
            title="Add relationship"
          />
        )}
        {/* Only own-tree nodes can be edited */}
        {!isConnected && (
          <ActionButton
            icon={<Pencil className="w-3 h-3" />}
            onClick={handleEdit}
            title="Edit person"
          />
        )}
      </div>

      {/* React Flow connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-white dark:!border-stone-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-white dark:!border-stone-900"
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="!w-2 !h-2 !bg-stone-400 !border-2 !border-white dark:!border-stone-900"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-stone-400 !border-2 !border-white dark:!border-stone-900"
      />
    </motion.div>
  );
});

// ── Inline sub-components ─────────────────────────────────────────────

function PersonNodeAvatar({
  firstName,
  surname,
  photoUrl,
  isConnected,
}: {
  firstName: string;
  surname: string;
  photoUrl: string | null;
  isConnected: boolean;
}) {
  const initials = `${firstName[0] ?? ""}${surname[0] ?? ""}`.toUpperCase();

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={cn(
          "w-12 h-12 rounded-full object-cover shadow-sm",
          isConnected
            ? "ring-2 ring-violet-400 dark:ring-violet-600"
            : "ring-2 ring-white dark:ring-stone-800"
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center shadow-sm",
        isConnected
          ? "bg-violet-600 ring-2 ring-violet-400 dark:ring-violet-700"
          : "lft-gradient ring-2 ring-white dark:ring-stone-800"
      )}
    >
      <span className="text-white font-bold text-sm">{initials}</span>
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  active,
  title,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-150",
        active
          ? "bg-amber-500 scale-110"
          : "bg-stone-700/80 hover:bg-primary hover:scale-110"
      )}
    >
      {icon}
    </button>
  );
}
