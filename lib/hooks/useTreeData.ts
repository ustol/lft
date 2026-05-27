"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildTreeData } from "@/lib/tree/treeBuilder";
import { calculateTreeLayout } from "@/lib/tree/layoutEngine";
import type { PersonRow, RelationshipRow, PhotoRow, TreeConnectionRow } from "@/types/database";
import type { TreeData } from "@/types/tree";

export const treeDataKey = (userId: string) => ["treeData", userId] as const;

export function useTreeData(userId: string) {
  const supabase = createClient();

  return useQuery<TreeData>({
    queryKey: treeDataKey(userId),
    queryFn: async () => {
      // 1. Parallel fetch: own persons, own in-tree relationships, approved connections
      const [
        { data: persons, error: pErr },
        { data: relationships, error: rErr },
        { data: connections, error: cErr },
      ] = await Promise.all([
        supabase.from("persons").select("*").eq("owner_id", userId),
        supabase
          .from("relationships")
          .select("*")
          .eq("owner_id", userId)
          .eq("is_cross_tree", false),
        supabase
          .from("tree_connections")
          .select("*")
          .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
          .eq("status", "approved"),
      ]);

      if (pErr) throw pErr;
      if (rErr) throw rErr;
      if (cErr) throw cErr;

      const personList = (persons ?? []) as PersonRow[];
      const ownPersonIds = new Set(personList.map((p) => p.id));

      // 2. Collect foreign person IDs from approved connections
      const foreignPersonIds = new Set<string>();
      for (const conn of (connections ?? []) as TreeConnectionRow[]) {
        const foreignId =
          conn.requester_id === userId
            ? conn.target_person_id
            : conn.requester_person_id;
        if (foreignId) foreignPersonIds.add(foreignId);
      }

      // 3. Fetch foreign persons (RLS allows read when connection is approved)
      let foreignPersons: PersonRow[] = [];
      if (foreignPersonIds.size > 0) {
        const { data: fp } = await supabase
          .from("persons")
          .select("*")
          .in("id", [...foreignPersonIds]);
        foreignPersons = (fp ?? []) as PersonRow[];
      }

      const allPersons = [...personList, ...foreignPersons];
      const allPersonIds = allPersons.map((p) => p.id);

      // 4. Fetch primary photos for all visible persons
      let photoMap: Record<string, PhotoRow> = {};
      if (allPersonIds.length > 0) {
        const { data: photos } = await supabase
          .from("photos")
          .select("*")
          .in("person_id", allPersonIds)
          .eq("sort_order", 0);
        photoMap = Object.fromEntries(
          (photos ?? []).map((ph: PhotoRow) => [ph.person_id, ph])
        );
      }

      // 5. Build cross-tree edges from connection records
      const crossTreeEdges = ((connections ?? []) as TreeConnectionRow[])
        .filter((c) => c.requester_person_id && c.target_person_id)
        .map((c) => ({
          id: `conn-${c.id}`,
          person_a_id: c.requester_person_id!,
          person_b_id: c.target_person_id!,
          relationship: c.relationship,
          is_cross_tree: true as const,
        }));

      const { nodes, edges } = buildTreeData(
        allPersons,
        (relationships ?? []) as RelationshipRow[],
        photoMap,
        ownPersonIds,
        crossTreeEdges
      );
      return calculateTreeLayout(nodes, edges);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

/** Subscribe to realtime changes for persons, relationships, and connections */
export function useRealtimeTree(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const invalidate = () =>
      qc.invalidateQueries({ queryKey: treeDataKey(userId) });

    const channel = supabase
      .channel(`tree-rt-${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "persons",
        filter: `owner_id=eq.${userId}`,
      }, invalidate)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "relationships",
        filter: `owner_id=eq.${userId}`,
      }, invalidate)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "tree_connections",
        filter: `requester_id=eq.${userId}`,
      }, invalidate)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "tree_connections",
        filter: `target_id=eq.${userId}`,
      }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, qc]);
}
