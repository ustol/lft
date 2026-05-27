"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, User, MapPin, Calendar, Heart, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { personSchema, type PersonFormValues } from "@/lib/validations/personSchema";
import { LocationPicker, type LocationValue } from "@/components/location/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonFormProps {
  defaultValues?: Partial<PersonFormValues>;
  onSubmit: (values: PersonFormValues) => Promise<void>;
  submitLabel?: string;
}

const SECTION = "space-y-4";
const FIELD = "space-y-1.5";

export function PersonForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save person",
}: PersonFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      status: "alive",
      firstName: "",
      surname: "",
      ...defaultValues,
    },
  });

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* ── Section: Identity ─────────────────────────── */}
      <FormSection icon={User} title="Identity">
        <div className={SECTION}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={FIELD}>
              <Label htmlFor="firstName">
                First Name <Required />
              </Label>
              <Input
                id="firstName"
                placeholder="Kwame"
                className="h-11 rounded-xl"
                {...register("firstName")}
              />
              <FieldError message={errors.firstName?.message} />
            </div>
            <div className={FIELD}>
              <Label htmlFor="surname">
                Surname <Required />
              </Label>
              <Input
                id="surname"
                placeholder="Mensah"
                className="h-11 rounded-xl"
                {...register("surname")}
              />
              <FieldError message={errors.surname?.message} />
            </div>
          </div>

          <div className={FIELD}>
            <Label htmlFor="middleNames">
              Middle Names{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="middleNames"
              placeholder="Acheampong Boateng"
              className="h-11 rounded-xl"
              {...register("middleNames")}
            />
            <FieldError message={errors.middleNames?.message} />
          </div>
        </div>
      </FormSection>

      {/* ── Section: Status ───────────────────────────── */}
      <FormSection icon={Heart} title="Status">
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <>
                {(["alive", "deceased"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => field.onChange(s)}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                      field.value === s
                        ? s === "alive"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "border-stone-400 bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent"
                    )}
                  >
                    {s === "alive" ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <Skull className="w-3.5 h-3.5" />
                    )}
                    {s === "alive" ? "Living" : "Deceased"}
                  </button>
                ))}
              </>
            )}
          />
        </div>
      </FormSection>

      {/* ── Section: Birth ────────────────────────────── */}
      <FormSection icon={Calendar} title="Birth">
        <div className={SECTION}>
          <div className={FIELD}>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              className="h-11 rounded-xl"
              {...register("dateOfBirth")}
            />
            <FieldError message={errors.dateOfBirth?.message} />
          </div>

          <div className={FIELD}>
            <Label>Place of Birth</Label>
            <Controller
              name="placeOfBirth"
              control={control}
              render={({ field }) => (
                <LocationPicker
                  value={{
                    address: field.value ?? "",
                    lat: watch("birthLat") ?? null,
                    lng: watch("birthLng") ?? null,
                  }}
                  onChange={(v: LocationValue) => {
                    field.onChange(v.address || null);
                    setValue("birthLat", v.lat ?? undefined);
                    setValue("birthLng", v.lng ?? undefined);
                  }}
                  placeholder="Search city, town, or click the map…"
                />
              )}
            />
          </div>
        </div>
      </FormSection>

      {/* ── Section: Death (animated) ─────────────────── */}
      <AnimatePresence>
        {status === "deceased" && (
          <motion.div
            key="death-section"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 32 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <FormSection icon={Skull} title="Death">
              <div className={SECTION}>
                <div className={FIELD}>
                  <Label htmlFor="dateOfDeath">Date of Death</Label>
                  <Input
                    id="dateOfDeath"
                    type="date"
                    className="h-11 rounded-xl"
                    {...register("dateOfDeath")}
                  />
                  <FieldError message={errors.dateOfDeath?.message} />
                </div>

                <div className={FIELD}>
                  <Label>Place of Death</Label>
                  <Controller
                    name="placeOfDeath"
                    control={control}
                    render={({ field }) => (
                      <LocationPicker
                        value={{
                          address: field.value ?? "",
                          lat: watch("deathLat") ?? null,
                          lng: watch("deathLng") ?? null,
                        }}
                        onChange={(v: LocationValue) => {
                          field.onChange(v.address || null);
                          setValue("deathLat", v.lat ?? undefined);
                          setValue("deathLng", v.lng ?? undefined);
                        }}
                        placeholder="Search city, town, or click the map…"
                      />
                    )}
                  />
                </div>

                <div className={FIELD}>
                  <Label htmlFor="causeOfDeath">
                    Cause of Death{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="causeOfDeath"
                    placeholder="e.g. Natural causes"
                    className="h-11 rounded-xl"
                    {...register("causeOfDeath")}
                  />
                  <FieldError message={errors.causeOfDeath?.message} />
                </div>
              </div>
            </FormSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submit ────────────────────────────────────── */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl font-semibold lft-gradient text-white border-0 shadow-sm"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

function Required() {
  return <span className="text-destructive ml-0.5">*</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
