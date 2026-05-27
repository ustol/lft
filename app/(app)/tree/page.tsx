import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FamilyTreeCanvas } from "@/components/tree/FamilyTreeCanvas";

export const metadata: Metadata = { title: "Family Tree" };

export default async function TreePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    // Full-screen canvas — no padding, overflow hidden
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden relative">
      <FamilyTreeCanvas userId={user.id} />
    </div>
  );
}
