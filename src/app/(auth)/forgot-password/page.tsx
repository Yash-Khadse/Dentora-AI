import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/onboarding/forgot-password-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Forgot Password — Dentora AI" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-2xl shadow-sm p-8 space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 dentora-gradient rounded-xl flex items-center justify-center text-xl">🦷</div>
            <span className="text-xl font-bold dentora-gradient-text tracking-tight">Dentora AI</span>
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl mx-auto mb-4">🔑</div>
            <h2 className="text-2xl font-bold tracking-tight">Reset your password</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <ForgotPasswordForm />

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border-2 border-border hover:border-primary/40 hover:bg-muted/50 text-sm font-medium transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
