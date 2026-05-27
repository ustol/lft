"use client";

import { useReactFlow, Panel } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowUpDown,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreeStore } from "@/lib/stores/treeStore";

export function TreeControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { layoutDirection, toggleLayoutDirection } = useTreeStore();

  return (
    <Panel position="bottom-right">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1.5 mb-4 mr-4"
      >
        <ControlButton onClick={() => zoomIn()} title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </ControlButton>
        <ControlButton onClick={() => zoomOut()} title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </ControlButton>
        <ControlButton onClick={() => fitView({ padding: 0.3, maxZoom: 1 })} title="Fit view">
          <Maximize2 className="w-4 h-4" />
        </ControlButton>
        <div className="h-px bg-border mx-1 my-0.5" />
        <ControlButton
          onClick={toggleLayoutDirection}
          title={`Switch to ${layoutDirection === "TB" ? "horizontal" : "vertical"} layout`}
        >
          {layoutDirection === "TB" ? (
            <ArrowLeftRight className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4" />
          )}
        </ControlButton>
      </motion.div>
    </Panel>
  );
}

function ControlButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "w-9 h-9 rounded-xl border border-border shadow-sm flex items-center justify-center transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}
