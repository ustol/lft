import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Start your family tree
        </h1>
        <p className="text-muted-foreground">
          Create a free account and begin mapping your heritage.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
