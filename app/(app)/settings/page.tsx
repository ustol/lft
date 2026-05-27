import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Lock, User, Bell } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const sections = [
    {
      href: "/settings",
      icon: User,
      title: "Profile",
      desc: "Display name, bio, avatar",
    },
    {
      href: "/settings/privacy",
      icon: Lock,
      title: "Privacy",
      desc: "Tree visibility, who can view",
    },
    {
      href: "/settings/account",
      icon: Bell,
      title: "Account",
      desc: "Email, password, notifications",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6 animate-slide-up">
      {/* LFTID card */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Your LFTID
        </p>
        <p className="font-mono text-2xl font-bold text-primary tracking-widest">
          {profile?.lftid ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          Share this ID with family members so they can find and connect to your
          tree.
        </p>
      </div>

      {/* Settings sections */}
      <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
        {sections.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-5 hover:bg-accent transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {title}
              </p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
