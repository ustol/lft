"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, ArrowRight, AlertCircle } from "lucide-react";
import { useTreeStore } from "@/lib/stores/treeStore";
import { useCreateRelationship } from "@/lib/hooks/useRelationships";
import { RELATIONSHIP_LABELS } from "@/types/tree";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RelationshipType } from "@/types/database";
import type { PersonNodeData } from "@/types/tree";

interface RelationshipDialogProps {
  /** The person initiating the connection (source) */
  sourceData: PersonNodeData;
  /** The person being connected to (target) */
  targetData: PersonNodeData;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; desc: string }[] = [
  { value: "mother", label: "Mother", desc: "Source is target's mother" },
  { value: "father", label: "Father", desc: "Source is target's father" },
  { value: "son", label: "Son", desc: "Source is target's son" },
  { value: "daughter", label: "Daughter", desc: "Source is target's daughter" },
  { value: "brother", label: "Brother", desc: "Source is target's brother" },
  { value: "sister", label: "Sister", desc: "Source is target's sister" },
];

export function RelationshipDialog({
  sourceData,
  targetData,
  userId,
  onClose,
  onSuccess,
}: RelationshipDialogProps) {
  const [selected, setSelected] = useState<RelationshipType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createRelationship = useCreateRelationship(userId);

  async function handleSave() {
    if (!selected) return;
    setError(null);
    try {
      await createRelationship.mutateAsync({
        personAId: sourceData.personId,
        personBId: targetData.personId,
        relationship: selected,
        ownerId: userId,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create relationship.");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl p-5 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold">Connect people</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define the relationship between these two people.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* People row */}
          <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
            <PersonPill name={`${sourceData.firstName} ${sourceData.surname}`} />
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <PersonPill name={`${targetData.firstName} ${targetData.surname}`} />
          </div>

          {/* Relationship type grid */}
          <div className="grid grid-cols-3 gap-2">
            {RELATIONSHIP_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelected(value)}
                className={cn(
                  "py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150",
                  selected === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Relationship description */}
          {selected && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2"
            >
              <strong>{sourceData.firstName}</strong> is{" "}
              <strong>{targetData.firstName}</strong>&apos;s{" "}
              <strong>{RELATIONSHIP_LABELS[selected]?.toLowerCase()}</strong>.
            </motion.p>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl lft-gradient text-white border-0"
              disabled={!selected || createRelationship.isPending}
              onClick={handleSave}
            >
              {createRelationship.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save relationship"
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PersonPill({ name }: { name: string }) {
  return (
    <div className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2.5 py-1.5 text-center">
      <p className="text-xs font-semibold text-foreground truncate">{name}</p>
    </div>
  );
}
