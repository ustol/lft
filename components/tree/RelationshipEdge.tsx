"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  label,
  data,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const isSibling = data?.isSibling as boolean | undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          opacity: selected ? 1 : 0.75,
          filter: selected ? "drop-shadow(0 0 4px oklch(0.65 0.15 60 / 0.6))" : undefined,
        }}
      />

      {/* Relationship label — only visible at reasonable zoom */}
      {label && !isSibling && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
            className="nodrag nopan"
          >
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase",
                "bg-background/90 backdrop-blur border border-border",
                isSibling ? "text-stone-400" : "text-amber-600 dark:text-amber-400"
              )}
            >
              {String(label)}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
