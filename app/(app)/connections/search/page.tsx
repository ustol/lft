import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LFTIDSearch } from "@/components/connections/LFTIDSearch";

export const metadata: Metadata = { title: "Find People" };

export default async function ConnectionSearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 lg:p-8 max-w-xl animate-slide-up">
      <div className="space-y-2 mb-8">
        <h2 className="font-display text-xl font-semibold">
          Connect a family tree
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter another user&apos;s LFTID to find and connect your trees.
        </p>
      </div>
      <LFTIDSearch userId={user.id} />
    </div>
  );
}
