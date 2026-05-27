import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GitBranch, Users, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: personCount }, { count: connectionCount }] =
    await Promise.all([
      supabase
        .from("persons")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id),
      supabase
        .from("tree_connections")
        .select("id", { count: "exact", head: true })
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .eq("status", "approved"),
    ]);

  const isEmpty = (personCount ?? 0) === 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-slide-up">
      {/* Welcome banner */}
      <div className="rounded-2xl lft-gradient p-6 lg:p-8 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">
              {isEmpty ? "Start your family tree" : "Your family tree"}
            </h2>
            <p className="text-white/75 mt-1 text-sm">
              {isEmpty
                ? "Add your first family member to begin your heritage journey."
                : `${personCount} people across your family tree`}
            </p>
          </div>
          <Link href={isEmpty ? "/person/new" : "/tree"}>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-xl font-semibold gap-2 shadow-lg"
            >
              {isEmpty ? (
                <>
                  <Plus className="w-4 h-4" /> Add first person
                </>
              ) : (
                <>
                  View tree <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Family Members",
            value: personCount ?? 0,
            icon: Users,
            href: "/tree",
          },
          {
            label: "Connected Trees",
            value: connectionCount ?? 0,
            icon: GitBranch,
            href: "/connections",
          },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group bg-card rounded-2xl p-5 border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold font-display text-foreground">
                  {value}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-4">
          Quick actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              href: "/person/new",
              icon: "👤",
              title: "Add a person",
              desc: "Record a new family member",
            },
            {
              href: "/connections/search",
              icon: "🔗",
              title: "Connect a tree",
              desc: "Link to another user's family",
            },
            {
              href: "/tree",
              icon: "🌳",
              title: "Explore tree",
              desc: "View the full interactive tree",
            },
          ].map(({ href, icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
