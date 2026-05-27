import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

// Fixed node dimensions — must match the PersonNode rendered size
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 136;

const RANK_SEP = 140; // vertical gap between generations
const NODE_SEP = 56;  // horizontal gap between siblings

export function calculateTreeLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    marginx: 60,
    marginy: 60,
  });

  nodes.forEach((n) =>
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  );

  // Only feed parent-child edges to Dagre (sibling edges don't affect rank)
  edges.forEach((e) => {
    if (e.data?.isSibling !== true) {
      g.setEdge(e.source, e.target);
    }
  });

  dagre.layout(g);

  const laidOutNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    // Dagre gives the centre point — React Flow uses top-left corner
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: laidOutNodes, edges };
}
