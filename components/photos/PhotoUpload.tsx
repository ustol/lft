"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImagePlus, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resizeImage, MAX_PHOTO_SIZE_MB, ACCEPTED_IMAGE_TYPES } from "@/lib/utils/imageUtils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PhotoRow } from "@/types/database";

interface PhotoUploadProps {
  personId: string;
  ownerId: string;
  existingPhotos: PhotoRow[];
  onPhotoAdded: (photo: PhotoRow) => void;
  onPhotoRemoved: (photoId: string) => void;
}

export function PhotoUpload({
  personId,
  ownerId,
  existingPhotos,
  onPhotoAdded,
  onPhotoRemoved,
}: PhotoUploadProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = existingPhotos.length < 4;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (!canUpload) {
        setError("Maximum of 4 photos allowed.");
        return;
      }

      setError(null);
      setUploading(true);

      try {
        // Resize before upload
        const blob = await resizeImage(file, 800);
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${ownerId}/${personId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("person-photos")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("person-photos")
          .getPublicUrl(path);

        const { data: photo, error: dbError } = await supabase
          .from("photos")
          .insert({
            person_id: personId,
            owner_id: ownerId,
            storage_path: path,
            url: urlData.publicUrl,
            sort_order: existingPhotos.length,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        if (photo) onPhotoAdded(photo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [canUpload, existingPhotos.length, ownerId, personId, supabase, onPhotoAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_IMAGE_TYPES.map((t) => [t, []])),
    maxSize: MAX_PHOTO_SIZE_MB * 1024 * 1024,
    maxFiles: 1,
    disabled: !canUpload || uploading,
  });

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {canUpload && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
            !canUpload && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ImagePlus className="w-6 h-6 text-primary" />
              </div>
            )}
            <p className="text-sm font-medium text-foreground">
              {uploading
                ? "Uploading…"
                : isDragActive
                ? "Drop the photo here"
                : "Drag a photo here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP · Max {MAX_PHOTO_SIZE_MB}MB ·{" "}
              {4 - existingPhotos.length} slot
              {4 - existingPhotos.length !== 1 ? "s" : ""} remaining
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Photo grid */}
      <AnimatePresence mode="popLayout">
        {existingPhotos.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {existingPhotos.map((photo, i) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isPrimary={i === 0}
                onRemove={() => onPhotoRemoved(photo.id)}
                supabase={supabase}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Single photo card ──────────────────────────────────────────────────

function PhotoCard({
  photo,
  isPrimary,
  onRemove,
  supabase,
}: {
  photo: PhotoRow;
  isPrimary: boolean;
  onRemove: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}) {
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState(photo.title ?? "");
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await supabase.storage.from("person-photos").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    onRemove();
  }

  async function handleTitleBlur() {
    if (title === (photo.title ?? "")) return;
    setSaving(true);
    await supabase
      .from("photos")
      .update({ title: title || null })
      .eq("id", photo.id);
    setSaving(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative bg-card rounded-xl overflow-hidden border border-border"
    >
      {/* Image */}
      <div className="relative aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.title ?? "Photo"}
          className="w-full h-full object-cover"
        />
        {isPrimary && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Primary
          </span>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <X className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Title input */}
      <div className="p-2">
        <div className="relative">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Add a caption…"
            className="h-8 text-xs rounded-lg pr-6"
          />
          {saving && (
            <Loader2 className="absolute right-2 top-2 w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
