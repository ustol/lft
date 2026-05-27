import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Pending connection requests count
  const { count: pendingCount } = await supabase
    .from("tree_connections")
    .select("id", { count: "exact", head: true })
    .eq("target_id", user.id)
    .eq("status", "pending");

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar user={profile} />
      <TopBar userId={user.id} initialPendingCount={pendingCount ?? 0} />
      <main className="pl-16 lg:pl-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
