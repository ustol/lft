"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Pencil,
  X,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PersonAvatar } from "./PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFullDate, calculateAge, lifeSpan } from "@/lib/utils/dateUtils";
import type { PersonRow, PhotoRow } from "@/types/database";

interface PersonModalProps {
  personId: string | null;
  onClose: () => void;
}

export function PersonModal({ personId, onClose }: PersonModalProps) {
  const [person, setPerson] = useState<PersonRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!personId) { setPerson(null); setPhotos([]); return; }
    setLoading(true);
    Promise.all([
      supabase.from("persons").select("*").eq("id", personId).single(),
      supabase.from("photos").select("*").eq("person_id", personId).order("sort_order"),
    ]).then(([{ data: p }, { data: ph }]) => {
      setPerson(p);
      setPhotos(ph ?? []);
      setActivePhoto(0);
    }).finally(() => setLoading(false));
  }, [personId, supabase]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isOpen = !!personId;
  const primaryPhoto = photos[activePhoto] ?? null;
  const age = person
    ? calculateAge(person.date_of_birth, person.date_of_death ?? null)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet — slides up from bottom on mobile, right panel on desktop */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border shadow-2xl z-50 overflow-y-auto flex flex-col"
          >
            {/* Close button */}
            <div className="sticky top-0 flex items-center justify-between p-4 bg-background/90 backdrop-blur border-b border-border z-10">
              <p className="text-xs font-mono text-muted-foreground">
                {person?.lftid ?? "Loading…"}
              </p>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <ModalSkeleton />
            ) : person ? (
              <div className="flex-1 overflow-y-auto">
                {/* Photo carousel */}
                {photos.length > 0 ? (
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={activePhoto}
                      src={primaryPhoto!.url}
                      alt={primaryPhoto?.title ?? "Photo"}
                      className="w-full h-full object-cover"
                    />
                    {/* Photo dots */}
                    {photos.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {photos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActivePhoto(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === activePhoto
                                ? "bg-white scale-125"
                                : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {/* Caption */}
                    {primaryPhoto?.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-8 pt-6">
                        <p className="text-white text-sm">{primaryPhoto.title}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 bg-muted">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}

                {/* Profile content */}
                <div className="p-6 space-y-6">
                  {/* Name + status */}
                  <div className="flex items-start gap-4">
                    <PersonAvatar
                      firstName={person.first_name}
                      surname={person.surname}
                      photoUrl={primaryPhoto?.url}
                      size="lg"
                      status={person.status}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-2xl font-bold leading-tight">
                        {person.first_name}
                        {person.middle_names ? ` ${person.middle_names}` : ""}
                      </h2>
                      <p className="font-display text-lg text-muted-foreground font-semibold">
                        {person.surname}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant={
                            person.status === "alive" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {person.status === "alive" ? "Living" : "Deceased"}
                        </Badge>
                        {age !== null && (
                          <span className="text-xs text-muted-foreground">
                            {age} years{person.status === "deceased" ? " old" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vital info */}
                  <div className="space-y-3">
                    <InfoRow
                      icon={Calendar}
                      label="Born"
                      value={
                        person.date_of_birth
                          ? formatFullDate(person.date_of_birth)
                          : undefined
                      }
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Birthplace"
                      value={person.place_of_birth ?? undefined}
                    />
                    {person.status === "deceased" && (
                      <>
                        <InfoRow
                          icon={Calendar}
                          label="Died"
                          value={
                            person.date_of_death
                              ? formatFullDate(person.date_of_death)
                              : undefined
                          }
                        />
                        <InfoRow
                          icon={MapPin}
                          label="Place of death"
                          value={person.place_of_death ?? undefined}
                        />
                        {person.cause_of_death && (
                          <InfoRow
                            icon={MapPin}
                            label="Cause of death"
                            value={person.cause_of_death}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Life span summary */}
                  {lifeSpan(person.date_of_birth, person.date_of_death) && (
                    <div className="bg-muted rounded-xl px-4 py-3 text-center">
                      <p className="font-display text-lg font-semibold text-foreground">
                        {lifeSpan(person.date_of_birth, person.date_of_death)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Footer actions */}
            {person && (
              <div className="sticky bottom-0 p-4 border-t border-border bg-background/90 backdrop-blur flex gap-3">
                <Link href={`/person/${person.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  className="flex-1 rounded-xl lft-gradient text-white border-0 gap-2"
                  onClick={onClose}
                >
                  <ExternalLink className="w-4 h-4" />
                  View in tree
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="flex gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
