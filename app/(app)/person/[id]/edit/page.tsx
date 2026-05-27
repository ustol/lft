import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditPersonClient } from "@/components/person/EditPersonClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit Person" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: person }, { data: photos }] = await Promise.all([
    supabase.from("persons").select("*").eq("id", id).single(),
    supabase
      .from("photos")
      .select("*")
      .eq("person_id", id)
      .order("sort_order"),
  ]);

  if (!person || person.owner_id !== user.id) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-2xl animate-slide-up">
      <Link
        href="/tree"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tree
      </Link>

      <div className="mb-8 space-y-1">
        <h2 className="font-display text-2xl font-bold">
          Edit {person.first_name} {person.surname}
        </h2>
        <p className="text-xs font-mono text-muted-foreground">{person.lftid}</p>
      </div>

      <EditPersonClient
        person={person}
        initialPhotos={photos ?? []}
        userId={user.id}
      />
    </div>
  );
}
