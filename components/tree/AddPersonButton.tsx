"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTreeStore } from "@/lib/stores/treeStore";

export function AddPersonButton() {
  const [open, setOpen] = useState(false);
  const { pendingRelationshipFrom, setPendingRelationshipFrom } = useTreeStore();

  // If we're in connecting mode, show a cancel button instead
  if (pendingRelationshipFrom) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-3 bg-amber-500 text-white rounded-2xl px-5 py-3 shadow-xl"
        >
          <span className="text-sm font-semibold">Click another person to connect</span>
          <button
            type="button"
            onClick={() => setPendingRelationshipFrom(null)}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <>
            {[
              { href: "/person/new", label: "Add new person", emoji: "👤" },
              { href: "/connections/search", label: "Connect a tree", emoji: "🔗" },
            ].map(({ href, label, emoji }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.85 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={href} onClick={() => setOpen(false)}>
                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl px-4 py-2.5 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-150 cursor-pointer group">
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary whitespace-nowrap">
                      {label}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="w-14 h-14 rounded-2xl lft-gradient text-white shadow-xl flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}
