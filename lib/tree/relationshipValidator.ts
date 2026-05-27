import type { RelationshipType, RelationshipRow } from "@/types/database";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const PARENT_TYPES = new Set<RelationshipType>(["mother", "father"]);
const CHILD_TYPES = new Set<RelationshipType>(["son", "daughter"]);

/** Returns the effective parent from a relationship record */
function getParentChildPair(
  rel: RelationshipRow
): { parentId: string; childId: string } | null {
  if (PARENT_TYPES.has(rel.relationship))
    return { parentId: rel.person_a_id, childId: rel.person_b_id };
  if (CHILD_TYPES.has(rel.relationship))
    return { parentId: rel.person_b_id, childId: rel.person_a_id };
  return null;
}

export function validateRelationship(
  personAId: string,
  personBId: string,
  relationship: RelationshipType,
  existing: RelationshipRow[]
): ValidationResult {
  if (personAId === personBId) {
    return { valid: false, reason: "A person cannot be related to themselves." };
  }

  // Exact duplicate check
  const isDuplicate = existing.some(
    (r) =>
      r.person_a_id === personAId &&
      r.person_b_id === personBId &&
      r.relationship === relationship
  );
  if (isDuplicate) {
    return { valid: false, reason: "This relationship already exists." };
  }

  // One mother / one father per person
  if (PARENT_TYPES.has(relationship)) {
    const alreadyHasParent = existing.some(
      (r) =>
        r.person_b_id === personBId && r.relationship === relationship
    );
    if (alreadyHasParent) {
      return {
        valid: false,
        reason: `${personBId} already has a ${relationship}.`,
      };
    }
  }
  if (CHILD_TYPES.has(relationship)) {
    // A is B's son/daughter → B is A's parent
    const parentType: RelationshipType =
      relationship === "son" ? "father" : "mother";
    const alreadyHasParent = existing.some(
      (r) =>
        r.person_a_id === personBId &&
        r.person_b_id === personAId &&
        r.relationship === parentType
    );
    if (alreadyHasParent) {
      return {
        valid: false,
        reason: `${personAId} already has a ${parentType}.`,
      };
    }
  }

  // Prevent direct ancestor/descendant cycle
  // e.g. A is B's father, and now we try to make B A's father
  const proposedPair = (() => {
    if (PARENT_TYPES.has(relationship))
      return { parentId: personAId, childId: personBId };
    if (CHILD_TYPES.has(relationship))
      return { parentId: personBId, childId: personAId };
    return null;
  })();

  if (proposedPair) {
    // Build ancestry map from existing edges
    const parentOf: Record<string, string[]> = {};
    existing.forEach((r) => {
      const pair = getParentChildPair(r);
      if (!pair) return;
      parentOf[pair.parentId] = parentOf[pair.parentId] ?? [];
      parentOf[pair.parentId].push(pair.childId);
    });

    // Check if proposedPair.parentId is already a descendant of proposedPair.childId
    function isDescendant(ancestor: string, target: string, visited = new Set<string>()): boolean {
      if (visited.has(ancestor)) return false;
      visited.add(ancestor);
      const children = parentOf[ancestor] ?? [];
      if (children.includes(target)) return true;
      return children.some((c) => isDescendant(c, target, visited));
    }

    if (isDescendant(proposedPair.childId, proposedPair.parentId)) {
      return {
        valid: false,
        reason: "This would create a cyclic ancestry (a person cannot be their own ancestor).",
      };
    }
  }

  return { valid: true };
}
