import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPersonClient } from "@/components/person/NewPersonClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Add Person" };

export default async function NewPersonPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 lg:p-8 max-w-2xl animate-slide-up">
      {/* Back navigation */}
      <Link
        href="/tree"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tree
      </Link>

      <div className="mb-8 space-y-1">
        <h2 className="font-display text-2xl font-bold">Add a family member</h2>
        <p className="text-sm text-muted-foreground">
          Enter the details for the new person in your family tree.
        </p>
      </div>

      <NewPersonClient userId={user.id} />
    </div>
  );
}
