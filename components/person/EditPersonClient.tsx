"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/lib/utils/toast";
import { PersonForm } from "./PersonForm";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import {
  useUpdatePerson,
  useDeletePerson,
} from "@/lib/hooks/usePersons";
import type { PersonFormValues } from "@/lib/validations/personSchema";
import type { PersonRow, PhotoRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditPersonClientProps {
  person: PersonRow;
  initialPhotos: PhotoRow[];
  userId: string;
}

export function EditPersonClient({
  person,
  initialPhotos,
  userId,
}: EditPersonClientProps) {
  const router = useRouter();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson(userId);
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const defaultValues: Partial<PersonFormValues> = {
    firstName: person.first_name,
    middleNames: person.middle_names ?? undefined,
    surname: person.surname,
    dateOfBirth: person.date_of_birth ?? undefined,
    status: person.status,
    dateOfDeath: person.date_of_death ?? undefined,
    causeOfDeath: person.cause_of_death ?? undefined,
    placeOfBirth: person.place_of_birth ?? undefined,
    birthLat: person.birth_lat ?? undefined,
    birthLng: person.birth_lng ?? undefined,
    placeOfDeath: person.place_of_death ?? undefined,
    deathLat: person.death_lat ?? undefined,
    deathLng: person.death_lng ?? undefined,
  };

  async function handleSubmit(values: PersonFormValues) {
    await updatePerson.mutateAsync({ ...values, id: person.id, ownerId: userId });
    toast.success("Person updated.");
    router.push("/tree");
  }

  async function handleDelete() {
    await deletePerson.mutateAsync(person.id);
    toast.success("Person removed from your tree.");
    router.push("/tree");
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="details">
        <TabsList className="rounded-xl">
          <TabsTrigger value="details" className="rounded-lg">
            Details
          </TabsTrigger>
          <TabsTrigger value="photos" className="rounded-lg">
            Photos ({photos.length}/4)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <PersonForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
          />
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <PhotoUpload
            personId={person.id}
            ownerId={userId}
            existingPhotos={photos}
            onPhotoAdded={(p) => setPhotos((prev) => [...prev, p])}
            onPhotoRemoved={(id) =>
              setPhotos((prev) => prev.filter((p) => p.id !== id))
            }
          />
        </TabsContent>
      </Tabs>

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
        <p className="text-sm font-semibold text-destructive">Danger zone</p>
        <p className="text-xs text-muted-foreground">
          Removing this person will also delete all their relationships and
          photos. This cannot be undone.
        </p>
        <AnimatePresence mode="wait">
          {!confirmDelete ? (
            <motion.div
              key="trigger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive hover:text-white gap-2"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove from tree
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-destructive font-medium">
                Are you sure?
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-xl gap-1.5"
                disabled={deletePerson.isPending}
                onClick={handleDelete}
              >
                {deletePerson.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Yes, remove
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
