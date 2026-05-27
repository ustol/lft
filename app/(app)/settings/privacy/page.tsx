import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Settings" };

export default function PrivacySettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl animate-slide-up">
      <p className="text-muted-foreground text-sm">
        Privacy controls — coming in the Settings module.
      </p>
    </div>
  );
}
