import type { Edge } from "@xyflow/react";
import type { PersonRow, RelationshipRow, PhotoRow, RelationshipType } from "@/types/database";
import type { PersonNode, PersonNodeData } from "@/types/tree";

// Edge colour constants
const EDGE_PARENT = "#D97706";      // amber — ancestral line
const EDGE_SIBLING = "#78716C";    // stone — lateral bond
const EDGE_CROSS_TREE = "#7C3AED"; // violet — connected tree

interface CrossTreeEdge {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relationship: RelationshipType;
  is_cross_tree: true;
}

/**
 * Normalises a relationship record into a directed parent→child edge.
 * Returns null for sibling relationships.
 */
function getParentChildDirection(
  rel: RelationshipRow | CrossTreeEdge
): { parentId: string; childId: string } | null {
  switch (rel.relationship) {
    case "mother":
    case "father":
      return { parentId: rel.person_a_id, childId: rel.person_b_id };
    case "son":
    case "daughter":
      return { parentId: rel.person_b_id, childId: rel.person_a_id };
    default:
      return null; // brother / sister
  }
}

export function buildTreeData(
  persons: PersonRow[],
  relationships: RelationshipRow[],
  primaryPhotos: Record<string, PhotoRow>,
  ownPersonIds: Set<string> = new Set(),
  crossTreeEdges: CrossTreeEdge[] = []
): { nodes: PersonNode[]; edges: Edge[] } {
  const nodes: PersonNode[] = persons.map((p, idx) => {
    const isConnected = ownPersonIds.size > 0 && !ownPersonIds.has(p.id);
    const data: PersonNodeData = {
      personId: p.id,
      lftid: p.lftid,
      firstName: p.first_name,
      middleNames: p.middle_names,
      surname: p.surname,
      dateOfBirth: p.date_of_birth,
      dateOfDeath: p.date_of_death,
      status: p.status,
      placeOfBirth: p.place_of_birth,
      primaryPhotoUrl: primaryPhotos[p.id]?.url ?? null,
      isSelf: p.is_self,
      isConnected,
      generation: 0, // overwritten by layout
    };
    return {
      id: p.id,
      type: "personNode",
      position: { x: idx * 240, y: 0 }, // Dagre overrides this
      data,
    };
  });

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];

  // In-tree relationship edges
  relationships.forEach((rel) => {
    const pc = getParentChildDirection(rel);
    const isSibling = pc === null;

    const source = isSibling ? rel.person_a_id : pc!.parentId;
    const target = isSibling ? rel.person_b_id : pc!.childId;
    const edgeId = rel.id;

    if (edgeSet.has(edgeId)) return;
    edgeSet.add(edgeId);

    edges.push({
      id: edgeId,
      source,
      target,
      type: "smoothstep",
      animated: !isSibling,
      style: {
        stroke: isSibling ? EDGE_SIBLING : EDGE_PARENT,
        strokeWidth: isSibling ? 1.5 : 2.5,
        strokeDasharray: isSibling ? "6 4" : undefined,
      },
      label: rel.relationship,
      labelStyle: {
        fontSize: 10,
        fill: "#A8A29E",
        fontFamily: "var(--font-inter)",
      },
      labelBgStyle: {
        fill: "var(--background)",
        fillOpacity: 0.8,
      },
      data: { isSibling, relationship: rel.relationship, isCrossTree: false },
    });
  });

  // Cross-tree connection edges
  crossTreeEdges.forEach((rel) => {
    const pc = getParentChildDirection(rel);
    const isSibling = pc === null;

    const source = isSibling ? rel.person_a_id : pc!.parentId;
    const target = isSibling ? rel.person_b_id : pc!.childId;

    if (edgeSet.has(rel.id)) return;
    edgeSet.add(rel.id);

    edges.push({
      id: rel.id,
      source,
      target,
      type: "smoothstep",
      animated: false,
      style: {
        stroke: EDGE_CROSS_TREE,
        strokeWidth: 2,
        strokeDasharray: "8 4",
      },
      label: rel.relationship,
      labelStyle: {
        fontSize: 10,
        fill: "#7C3AED",
        fontFamily: "var(--font-inter)",
      },
      labelBgStyle: {
        fill: "var(--background)",
        fillOpacity: 0.8,
      },
      data: { isSibling, relationship: rel.relationship, isCrossTree: true },
    });
  });

  return { nodes, edges };
}
