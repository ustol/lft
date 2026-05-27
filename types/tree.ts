import type { Node, Edge } from "@xyflow/react";
import type { PersonStatus } from "./database";

// ── Node data shape ──────────────────────────────────────────────────
export interface PersonNodeData extends Record<string, unknown> {
  personId: string;
  lftid: string;
  firstName: string;
  middleNames: string | null;
  surname: string;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  status: PersonStatus;
  placeOfBirth: string | null;
  primaryPhotoUrl: string | null;
  isSelf: boolean;
  generation: number;
  isConnected: boolean; // true for persons from other users' trees
}

// Use the generic Node alias so it stays compatible with React Flow's
// base Node type in useNodesState / layout engine return values.
export type PersonNode = Node<PersonNodeData, "personNode">;
export type LFTEdge = Edge;

// ── Processed tree data ──────────────────────────────────────────────
// Use base Node/Edge to stay compatible with the layout engine output.
export interface TreeData {
  nodes: Node[];
  edges: Edge[];
}

// ── Layout ───────────────────────────────────────────────────────────
export type LayoutDirection = "TB" | "LR";

// ── Relationship meta ─────────────────────────────────────────────────
export const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  brother: "Brother",
  sister: "Sister",
  son: "Son",
  daughter: "Daughter",
};

export const PARENT_RELATIONSHIPS = new Set(["mother", "father"]);
export const CHILD_RELATIONSHIPS = new Set(["son", "daughter"]);
export const SIBLING_RELATIONSHIPS = new Set(["brother", "sister"]);

// ── Search result ─────────────────────────────────────────────────────
export interface PersonSearchResult {
  id: string;
  lftid: string;
  firstName: string;
  surname: string;
  dateOfBirth: string | null;
  status: PersonStatus;
  primaryPhotoUrl: string | null;
}

// ── Connection request UI state ───────────────────────────────────────
export interface PendingConnection {
  id: string;
  requesterDisplayName: string;
  requesterAvatarUrl: string | null;
  requesterLftid: string;
  requesterPersonName: string;
  targetPersonName: string;
  relationship: string;
  message: string | null;
  createdAt: string;
}
