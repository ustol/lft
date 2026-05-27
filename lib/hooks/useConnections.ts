"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TreeConnectionRow, RelationshipType } from "@/types/database";

// ── Query keys ─────────────────────────────────────────────────────────
export const connectionKeys = {
  incoming: (userId: string) => ["connections", "incoming", userId] as const,
  outgoing: (userId: string) => ["connections", "outgoing", userId] as const,
  pendingCount: (userId: string) =>
    ["connections", "pendingCount", userId] as const,
};

// ── Enriched connection type for display ──────────────────────────────
export interface EnrichedConnection extends TreeConnectionRow {
  requester: {
    id: string;
    lftid: string;
    display_name: string;
    avatar_url: string | null;
  };
  target: {
    id: string;
    lftid: string;
    display_name: string;
    avatar_url: string | null;
  };
  requester_person_name: string | null;
  target_person_name: string | null;
}

// ── Incoming requests ─────────────────────────────────────────────────
export function useIncomingConnections(userId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: connectionKeys.incoming(userId),
    queryFn: async (): Promise<EnrichedConnection[]> => {
      const { data, error } = await supabase
        .from("tree_connections")
        .select("*")
        .eq("target_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return enrichConnections(data as TreeConnectionRow[], supabase);
    },
    enabled: !!userId,
    staleTime: 20_000,
  });
}

// ── Outgoing requests ─────────────────────────────────────────────────
export function useOutgoingConnections(userId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: connectionKeys.outgoing(userId),
    queryFn: async (): Promise<EnrichedConnection[]> => {
      const { data, error } = await supabase
        .from("tree_connections")
        .select("*")
        .eq("requester_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return enrichConnections(data as TreeConnectionRow[], supabase);
    },
    enabled: !!userId,
    staleTime: 20_000,
  });
}

// ── Pending count (for badge) ─────────────────────────────────────────
export function usePendingConnectionCount(userId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: connectionKeys.pendingCount(userId),
    queryFn: async () => {
      const { count } = await supabase
        .from("tree_connections")
        .select("id", { count: "exact", head: true })
        .eq("target_id", userId)
        .eq("status", "pending");
      return count ?? 0;
    },
    enabled: !!userId,
    staleTime: 10_000,
  });
}

// ── Send connection request ───────────────────────────────────────────
interface SendConnectionInput {
  targetUserId: string;
  requesterPersonId: string;
  relationship: RelationshipType;
  message?: string;
}

export function useSendConnection(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendConnectionInput) => {
      // Check for an existing pending/approved connection to this user
      const { data: existing } = await supabase
        .from("tree_connections")
        .select("id, status")
        .eq("requester_id", userId)
        .eq("target_id", input.targetUserId)
        .in("status", ["pending", "approved"])
        .maybeSingle();

      if (existing) {
        throw new Error(
          existing.status === "approved"
            ? "You are already connected with this user."
            : "A connection request is already pending."
        );
      }

      const { data, error } = await supabase
        .from("tree_connections")
        .insert({
          requester_id: userId,
          target_id: input.targetUserId,
          requester_person_id: input.requesterPersonId,
          relationship: input.relationship,
          message: input.message ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TreeConnectionRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: connectionKeys.outgoing(userId) });
    },
  });
}

// ── Approve connection ────────────────────────────────────────────────
interface ApproveConnectionInput {
  connectionId: string;
  targetPersonId: string; // the approver's person being connected
  requesterPersonId: string;
  relationship: RelationshipType;
  requesterId: string;
}

export function useApproveConnection(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApproveConnectionInput) => {
      // 1. Update connection status
      const { error: connErr } = await supabase
        .from("tree_connections")
        .update({ status: "approved", resolved_at: new Date().toISOString() })
        .eq("id", input.connectionId);
      if (connErr) throw connErr;

      // 2. Create the cross-tree relationship (owned by approver)
      const { error: relErr } = await supabase
        .from("relationships")
        .insert({
          person_a_id: input.requesterPersonId,
          person_b_id: input.targetPersonId,
          relationship: input.relationship,
          owner_id: userId,
          is_cross_tree: true,
        });
      // Ignore duplicate — relationship may already exist
      if (relErr && !relErr.message.includes("unique")) throw relErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: connectionKeys.incoming(userId) });
      qc.invalidateQueries({ queryKey: connectionKeys.pendingCount(userId) });
      // Invalidate tree so merged persons appear
      qc.invalidateQueries({ queryKey: ["treeData", userId] });
    },
  });
}

// ── Reject / cancel connection ────────────────────────────────────────
export function useRejectConnection(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      connectionId,
      action,
    }: {
      connectionId: string;
      action: "rejected" | "cancelled";
    }) => {
      const { error } = await supabase
        .from("tree_connections")
        .update({ status: action, resolved_at: new Date().toISOString() })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: connectionKeys.incoming(userId) });
      qc.invalidateQueries({ queryKey: connectionKeys.outgoing(userId) });
      qc.invalidateQueries({ queryKey: connectionKeys.pendingCount(userId) });
    },
  });
}

// ── Realtime subscription ─────────────────────────────────────────────
export function useRealtimeConnections(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`connections-rt-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tree_connections",
          filter: `target_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: connectionKeys.incoming(userId) });
          qc.invalidateQueries({
            queryKey: connectionKeys.pendingCount(userId),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tree_connections",
          filter: `requester_id=eq.${userId}`,
        },
        () =>
          qc.invalidateQueries({ queryKey: connectionKeys.outgoing(userId) })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, qc]);
}

// ── Helper: enrich raw connections with user + person names ──────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichConnections(raw: TreeConnectionRow[], supabase: any): Promise<EnrichedConnection[]> {
  const userIds = [
    ...new Set(raw.flatMap((r) => [r.requester_id, r.target_id])),
  ];
  const personIds = [
    ...new Set(
      raw.flatMap((r) =>
        [r.requester_person_id, r.target_person_id].filter(Boolean)
      )
    ),
  ] as string[];

  const [{ data: users }, { data: persons }] = await Promise.all([
    supabase
      .from("users")
      .select("id, lftid, display_name, avatar_url")
      .in("id", userIds),
    personIds.length > 0
      ? supabase
          .from("persons")
          .select("id, first_name, surname")
          .in("id", personIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userMap = Object.fromEntries(
    (users ?? []).map((u: { id: string; [key: string]: unknown }) => [u.id, u])
  );
  const personMap = Object.fromEntries(
    (persons ?? []).map(
      (p: { id: string; first_name: string; surname: string }) => [
        p.id,
        `${p.first_name} ${p.surname}`,
      ]
    )
  );

  return raw.map((r) => ({
    ...r,
    requester: userMap[r.requester_id],
    target: userMap[r.target_id],
    requester_person_name: r.requester_person_id
      ? (personMap[r.requester_person_id] ?? null)
      : null,
    target_person_name: r.target_person_id
      ? (personMap[r.target_person_id] ?? null)
      : null,
  }));
}
