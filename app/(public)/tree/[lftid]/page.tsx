import type { Metadata } from "next";

export const metadata: Metadata = { title: "Family Tree" };

export default async function PublicTreePage({
  params,
}: {
  params: Promise<{ lftid: string }>;
}) {
  const { lftid } = await params;
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="text-5xl">🌳</div>
        <p className="font-display text-xl font-semibold">
          Public tree — {lftid}
        </p>
        <p className="text-sm text-muted-foreground">
          Public tree view — coming in a later module.
        </p>
      </div>
    </div>
  );
}
