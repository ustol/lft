import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
