"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { generateLFTID } from "@/lib/utils/lftid";
import type { PersonRow } from "@/types/database";
import type { PersonFormValues } from "@/lib/validations/personSchema";

// ── Query keys ─────────────────────────────────────────────────────────
export const personKeys = {
  all: (userId: string) => ["persons", userId] as const,
  one: (personId: string) => ["person", personId] as const,
};

// ── List all persons for a user ────────────────────────────────────────
export function usePersons(userId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: personKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("persons")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PersonRow[];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

// ── Single person ──────────────────────────────────────────────────────
export function usePerson(personId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: personKeys.one(personId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("persons")
        .select("*")
        .eq("id", personId!)
        .single();
      if (error) throw error;
      return data as PersonRow;
    },
    enabled: !!personId,
  });
}

// ── Create person ──────────────────────────────────────────────────────
interface CreatePersonInput extends PersonFormValues {
  ownerId: string;
  isSelf?: boolean;
}

export function useCreatePerson(
  options?: UseMutationOptions<PersonRow, Error, CreatePersonInput>
) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePersonInput) => {
      const lftid = generateLFTID("LFT");
      const { data, error } = await supabase
        .from("persons")
        .insert({
          lftid,
          owner_id: input.ownerId,
          first_name: input.firstName,
          middle_names: input.middleNames ?? null,
          surname: input.surname,
          date_of_birth: input.dateOfBirth ?? null,
          date_of_death: input.dateOfDeath ?? null,
          status: input.status,
          cause_of_death: input.causeOfDeath ?? null,
          place_of_birth: input.placeOfBirth ?? null,
          birth_lat: input.birthLat ?? null,
          birth_lng: input.birthLng ?? null,
          place_of_death: input.placeOfDeath ?? null,
          death_lat: input.deathLat ?? null,
          death_lng: input.deathLng ?? null,
          is_self: input.isSelf ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PersonRow;
    },
    onSuccess: (newPerson) => {
      // Optimistically insert into the list cache
      qc.setQueryData<PersonRow[]>(
        personKeys.all(newPerson.owner_id),
        (old) => (old ? [newPerson, ...old] : [newPerson])
      );
      qc.setQueryData(personKeys.one(newPerson.id), newPerson);
    },
    ...options,
  });
}

// ── Update person ──────────────────────────────────────────────────────
interface UpdatePersonInput extends PersonFormValues {
  id: string;
  ownerId: string;
}

export function useUpdatePerson(
  options?: UseMutationOptions<PersonRow, Error, UpdatePersonInput>
) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePersonInput) => {
      const { data, error } = await supabase
        .from("persons")
        .update({
          first_name: input.firstName,
          middle_names: input.middleNames ?? null,
          surname: input.surname,
          date_of_birth: input.dateOfBirth ?? null,
          date_of_death: input.dateOfDeath ?? null,
          status: input.status,
          cause_of_death: input.causeOfDeath ?? null,
          place_of_birth: input.placeOfBirth ?? null,
          birth_lat: input.birthLat ?? null,
          birth_lng: input.birthLng ?? null,
          place_of_death: input.placeOfDeath ?? null,
          death_lat: input.deathLat ?? null,
          death_lng: input.deathLng ?? null,
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as PersonRow;
    },
    onSuccess: (updated) => {
      qc.setQueryData(personKeys.one(updated.id), updated);
      qc.setQueryData<PersonRow[]>(
        personKeys.all(updated.owner_id),
        (old) => old?.map((p) => (p.id === updated.id ? updated : p))
      );
    },
    ...options,
  });
}

// ── Delete person ──────────────────────────────────────────────────────
export function useDeletePerson(ownerId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase
        .from("persons")
        .delete()
        .eq("id", personId);
      if (error) throw error;
      return personId;
    },
    onSuccess: (deletedId) => {
      qc.setQueryData<PersonRow[]>(
        personKeys.all(ownerId),
        (old) => old?.filter((p) => p.id !== deletedId)
      );
      qc.removeQueries({ queryKey: personKeys.one(deletedId) });
    },
  });
}

// ── Realtime subscription ─────────────────────────────────────────────
import { useEffect } from "react";

export function useRealtimePersons(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`persons-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "persons",
          filter: `owner_id=eq.${userId}`,
        },
        () => qc.invalidateQueries({ queryKey: personKeys.all(userId) })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, qc]);
}
