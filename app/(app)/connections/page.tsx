import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectionsClient } from "@/components/connections/ConnectionsClient";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ConnectionsClient userId={user.id} />;
}
