import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/onboarding/register-form";

export const metadata: Metadata = { title: "Create Account — Dentora AI" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-[45%] dentora-gradient flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">🦷</div>
          <span className="text-xl font-bold tracking-tight">Dentora AI</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-3">Start Your Journey</p>
            <h1 className="text-4xl font-bold leading-tight">
              Crack Your BDS<br />Finals with AI
            </h1>
            <p className="text-white/75 mt-4 text-base leading-relaxed">
              Join hundreds of BDS final year students who are preparing smarter, not harder.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: "🎯", text: "AI generates your personalized study plan in minutes" },
              { icon: "🎤", text: "Practice viva with an AI dental examiner anytime" },
              { icon: "🔮", text: "Predict high-yield topics from previous papers" },
              { icon: "🧠", text: "Spaced repetition flashcards for long-term retention" },
              { icon: "📊", text: "Track your readiness score up to your exam date" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 bg-white/10 rounded-xl p-3.5 border border-white/10">
                <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                <span className="text-white/90 text-sm leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/50">
          Meghna Institute of Dental Sciences · RGUHS
        </p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 dentora-gradient rounded-xl flex items-center justify-center text-xl">🦷</div>
            <span className="text-xl font-bold dentora-gradient-text tracking-tight">Dentora AI</span>
          </div>

          {/* Form card */}
          <div className="bg-card border rounded-2xl shadow-sm p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
              <p className="text-muted-foreground text-sm mt-1">Start your personalized BDS exam preparation — free</p>
            </div>

            <RegisterForm />

            <div className="relative flex items-center gap-4">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">Have an account?</span>
              <div className="flex-1 border-t" />
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center w-full h-10 rounded-lg border-2 border-border hover:border-primary/40 hover:bg-muted/50 text-sm font-medium transition-all"
            >
              Sign in instead
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Need help?{" "}
            <a href="mailto:support@dentora.ai" className="text-primary hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
