import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/onboarding/login-form";

export const metadata: Metadata = { title: "Sign In — Dentora AI" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-[45%] dentora-gradient flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold backdrop-blur-sm">🦷</div>
          <span className="text-xl font-bold tracking-tight">Dentora AI</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-3">BDS Final Year Platform</p>
            <h1 className="text-4xl font-bold leading-tight">
              Your AI-Powered<br />BDS Success Partner
            </h1>
            <p className="text-white/75 mt-4 text-base leading-relaxed">
              Personalized study plans, AI viva practice, exam prediction, and smart revision — built for final year BDS students.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "📊", label: "Readiness Score", desc: "Real-time exam readiness" },
              { icon: "🤖", label: "AI Tutor", desc: "24/7 dental mentor" },
              { icon: "🎤", label: "Viva Simulator", desc: "Practice with AI examiner" },
              { icon: "🔮", label: "Exam Predictor", desc: "Predict likely questions" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-semibold text-sm">{f.label}</div>
                <div className="text-xs text-white/65 mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex -space-x-2">
              {["👨‍⚕️","👩‍⚕️","👨‍⚕️","👩‍⚕️"].map((e, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm border-2 border-white/30">{e}</div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold">500+ BDS students</p>
              <p className="text-xs text-white/65">already preparing smarter</p>
            </div>
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
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-muted-foreground text-sm mt-1">Sign in to continue your exam preparation</p>
            </div>

            <LoginForm />

            <div className="relative flex items-center gap-4">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">New to Dentora?</span>
              <div className="flex-1 border-t" />
            </div>

            <Link
              href="/register"
              className="flex items-center justify-center w-full h-10 rounded-lg border-2 border-border hover:border-primary/40 hover:bg-muted/50 text-sm font-medium transition-all"
            >
              Create free account
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Having trouble signing in?{" "}
            <a href="mailto:support@dentora.ai" className="text-primary hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
