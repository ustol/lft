"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus } from "lucide-react";

import { PersonNode } from "./PersonNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { TreeControls } from "./TreeControls";
import { AddPersonButton } from "./AddPersonButton";
import { RelationshipDialog } from "./RelationshipDialog";
import { PersonModal } from "@/components/person/PersonModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { useTreeData, useRealtimeTree } from "@/lib/hooks/useTreeData";
import { useTreeStore } from "@/lib/stores/treeStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { calculateTreeLayout } from "@/lib/tree/layoutEngine";
import type { PersonNodeData } from "@/types/tree";

const NODE_TYPES = { personNode: PersonNode };
const EDGE_TYPES = { smoothstep: RelationshipEdge };

interface FamilyTreeCanvasProps {
  userId: string;
}

function CanvasInner({ userId }: FamilyTreeCanvasProps) {
  const { data, isLoading, error } = useTreeData(userId);
  useRealtimeTree(userId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [fitDone, setFitDone] = useState(false);

  const {
    selectedPersonId,
    setSelectedPerson,
    pendingRelationshipFrom,
    setPendingRelationshipFrom,
    layoutDirection,
  } = useTreeStore();

  const { personModalId, openPersonModal, closePersonModal } = useUIStore();

  // Sync data → local React Flow state
  useEffect(() => {
    if (!data) return;
    const laid = calculateTreeLayout(data.nodes, data.edges, layoutDirection);
    setNodes(laid.nodes);
    setEdges(laid.edges);
    setFitDone(false);
  }, [data, layoutDirection, setNodes, setEdges]);

  // Find node data by id
  const getNodeData = useCallback(
    (id: string): PersonNodeData | undefined =>
      nodes.find((n) => n.id === id)?.data as PersonNodeData | undefined,
    [nodes]
  );

  // Source data for relationship dialog
  const connectSourceData = pendingRelationshipFrom
    ? getNodeData(pendingRelationshipFrom)
    : undefined;
  const connectTargetData =
    pendingRelationshipFrom && selectedPersonId && selectedPersonId !== pendingRelationshipFrom
      ? getNodeData(selectedPersonId)
      : undefined;

  function closeRelationshipDialog() {
    setSelectedPerson(null);
    setPendingRelationshipFrom(null);
  }

  // Loading state
  if (isLoading) return <CanvasSkeleton />;

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive text-sm">
        Failed to load tree. Please refresh.
      </div>
    );
  }

  // Empty state
  if (!data || nodes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full gap-6 text-center px-6"
      >
        {/* Illustrated placeholder */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl lft-gradient opacity-20 absolute -inset-3 blur-xl" />
          <div className="relative text-6xl">🌳</div>
        </div>
        <div className="space-y-2 max-w-xs">
          <h2 className="font-display text-2xl font-bold">
            Your tree starts here
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add yourself or your first family member to begin building your
            heritage map.
          </p>
        </div>
        <Link href="/person/new">
          <Button
            size="lg"
            className="rounded-2xl lft-gradient text-white border-0 shadow-lg gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add first person
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView={!fitDone}
        fitViewOptions={{ padding: 0.35, maxZoom: 1 }}
        onInit={() => setFitDone(true)}
        minZoom={0.08}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false} // We handle connections manually via the RelationshipDialog
        elementsSelectable
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
        className="bg-stone-50 dark:bg-stone-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color="oklch(0.7 0 0 / 0.15)"
        />

        <MiniMap
          nodeColor={(n) => {
            const d = n.data as PersonNodeData;
            return d?.status === "alive" ? "#059669" : "#A8A29E";
          }}
          maskColor="oklch(0 0 0 / 0.07)"
          className="!rounded-2xl !border !border-border !bg-background/80 !backdrop-blur"
          position="bottom-left"
          zoomable
          pannable
        />

        <TreeControls />
      </ReactFlow>

      {/* FAB / connecting indicator — positioned over the canvas */}
      <AddPersonButton />

      {/* Person profile modal */}
      <PersonModal
        personId={personModalId}
        onClose={closePersonModal}
      />

      {/* Relationship connection dialog */}
      {connectSourceData && connectTargetData && (
        <RelationshipDialog
          sourceData={connectSourceData}
          targetData={connectTargetData}
          userId={userId}
          onClose={closeRelationshipDialog}
          onSuccess={closeRelationshipDialog}
        />
      )}
    </>
  );
}

// Wrap with ReactFlowProvider so useReactFlow() works inside TreeControls
export function FamilyTreeCanvas(props: FamilyTreeCanvasProps) {
  return (
    <ReactFlowProvider>
      <div className="relative w-full h-full">
        <CanvasInner {...props} />
      </div>
    </ReactFlowProvider>
  );
}

function CanvasSkeleton() {
  return (
    <div className="w-full h-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
      <div className="grid grid-cols-3 gap-8 p-8 opacity-30">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-48 h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
