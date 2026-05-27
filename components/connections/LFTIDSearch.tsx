"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowLeft,
  CheckCircle2,
  User,
  Send,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { usePersons } from "@/lib/hooks/usePersons";
import { useSendConnection } from "@/lib/hooks/useConnections";
import type { UserRow, RelationshipType } from "@/types/database";
import { cn } from "@/lib/utils";

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  mother: "Mother",
  father: "Father",
  brother: "Brother",
  sister: "Sister",
  son: "Son",
  daughter: "Daughter",
};

const configureSchema = z.object({
  requesterPersonId: z.string().min(1, "Select a person from your tree"),
  relationship: z.enum([
    "mother",
    "father",
    "brother",
    "sister",
    "son",
    "daughter",
  ] as const),
  message: z.string().max(280).optional(),
});
type ConfigureValues = z.infer<typeof configureSchema>;

type Step = "search" | "configure" | "success";

interface LFTIDSearchProps {
  userId: string;
}

export function LFTIDSearch({ userId }: LFTIDSearchProps) {
  const [step, setStep] = useState<Step>("search");
  const [lftidInput, setLftidInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<UserRow | null>(null);

  const { data: myPersons = [] } = usePersons(userId);
  const sendConnection = useSendConnection(userId);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConfigureValues>({
    resolver: zodResolver(configureSchema),
  });

  const selectedRelationship = watch("relationship");

  const handleSearch = useCallback(async () => {
    const clean = lftidInput.trim().toUpperCase();
    if (!clean) return;

    setSearching(true);
    setSearchError(null);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("lftid", clean)
        .single();

      if (error || !data) {
        setSearchError(
          "No user found with that LFTID. Check the ID and try again."
        );
        return;
      }
      if (data.id === userId) {
        setSearchError("That's your own LFTID.");
        return;
      }
      setFoundUser(data as UserRow);
      setStep("configure");
    } finally {
      setSearching(false);
    }
  }, [lftidInput, userId, supabase]);

  const handleConfigure = useCallback(
    async (values: ConfigureValues) => {
      if (!foundUser) return;
      try {
        await sendConnection.mutateAsync({
          targetUserId: foundUser.id,
          requesterPersonId: values.requesterPersonId,
          relationship: values.relationship,
          message: values.message || undefined,
        });
        setStep("success");
      } catch {
        // error displayed via sendConnection.error
      }
    },
    [foundUser, sendConnection]
  );

  function reset() {
    setStep("search");
    setFoundUser(null);
    setLftidInput("");
    setSearchError(null);
    sendConnection.reset();
  }

  return (
    <AnimatePresence mode="wait">
      {step === "search" && (
        <motion.div
          key="search"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="space-y-4"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={lftidInput}
                onChange={(e) => {
                  setLftidInput(e.target.value.toUpperCase());
                  setSearchError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="LFT-XXXXXX"
                className="pl-9 rounded-xl font-mono tracking-wider uppercase"
                maxLength={10}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching || lftidInput.length < 9}
              className="rounded-xl lft-gradient text-white border-0"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Find"
              )}
            </Button>
          </div>

          <AnimatePresence>
            {searchError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-destructive"
              >
                {searchError}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground">
            Ask the person you want to connect with for their LFTID. You can
            find yours in the sidebar.
          </p>
        </motion.div>
      )}

      {step === "configure" && foundUser && (
        <motion.div
          key="configure"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          className="space-y-5"
        >
          {/* Found user card */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
            {foundUser.avatar_url ? (
              <Image
                src={foundUser.avatar_url}
                alt=""
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="w-11 h-11 rounded-full lft-gradient flex items-center justify-center ring-2 ring-background">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{foundUser.display_name}</p>
              <p className="text-xs font-mono text-muted-foreground">
                {foundUser.lftid}
              </p>
              {foundUser.bio && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {foundUser.bio}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(handleConfigure)} className="space-y-5">
            {/* My person selector */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">You are connecting as</Label>
              <select
                {...register("requesterPersonId")}
                className={cn(
                  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  errors.requesterPersonId && "border-destructive"
                )}
              >
                <option value="">Select a person from your tree…</option>
                {myPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.surname}
                    {p.is_self ? " (You)" : ""}
                  </option>
                ))}
              </select>
              {errors.requesterPersonId && (
                <p className="text-xs text-destructive">
                  {errors.requesterPersonId.message}
                </p>
              )}
            </div>

            {/* Relationship grid */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                The selected person is their
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map(
                  (rel) => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setValue("relationship", rel)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-150",
                        selectedRelationship === rel
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      {RELATIONSHIP_LABELS[rel]}
                    </button>
                  )
                )}
              </div>
              {errors.relationship && (
                <p className="text-xs text-destructive">
                  {errors.relationship.message}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Message{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                {...register("message")}
                placeholder="Add a note to help them identify you…"
                className="rounded-xl resize-none text-sm"
                rows={3}
                maxLength={280}
              />
            </div>

            {sendConnection.error && (
              <p className="text-sm text-destructive">
                {(sendConnection.error as Error).message}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                className="rounded-xl gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={sendConnection.isPending}
                className="flex-1 rounded-xl lft-gradient text-white border-0 gap-2"
              >
                {sendConnection.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send request
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 py-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 300 }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </motion.div>
          <div className="space-y-1">
            <p className="font-display font-semibold text-lg">Request sent!</p>
            <p className="text-sm text-muted-foreground">
              {foundUser?.display_name} will be notified. You&apos;ll get an
              update when they respond.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={reset} className="rounded-xl">
              Search again
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="rounded-xl lft-gradient text-white border-0"
            >
              View connections
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
