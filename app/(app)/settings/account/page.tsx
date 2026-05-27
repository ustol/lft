import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account Settings" };

export default function AccountSettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl animate-slide-up">
      <p className="text-muted-foreground text-sm">
        Account management — coming in the Settings module.
      </p>
    </div>
  );
}
