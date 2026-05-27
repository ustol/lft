"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { validateRelationship } from "@/lib/tree/relationshipValidator";
import type { RelationshipRow, RelationshipType } from "@/types/database";

export const relationshipKeys = {
  all: (userId: string) => ["relationships", userId] as const,
};

export function useRelationships(userId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: relationshipKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relationships")
        .select("*")
        .eq("owner_id", userId);
      if (error) throw error;
      return data as RelationshipRow[];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

interface CreateRelationshipInput {
  personAId: string;
  personBId: string;
  relationship: RelationshipType;
  ownerId: string;
}

export function useCreateRelationship(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRelationshipInput) => {
      // Fetch current relationships to validate
      const { data: existing } = await supabase
        .from("relationships")
        .select("*")
        .eq("owner_id", input.ownerId);

      const result = validateRelationship(
        input.personAId,
        input.personBId,
        input.relationship,
        existing ?? []
      );
      if (!result.valid) throw new Error(result.reason);

      const { data, error } = await supabase
        .from("relationships")
        .insert({
          person_a_id: input.personAId,
          person_b_id: input.personBId,
          relationship: input.relationship,
          owner_id: input.ownerId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as RelationshipRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: relationshipKeys.all(userId) });
    },
  });
}

export function useDeleteRelationship(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await supabase
        .from("relationships")
        .delete()
        .eq("id", relationshipId);
      if (error) throw error;
      return relationshipId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: relationshipKeys.all(userId) });
    },
  });
}
