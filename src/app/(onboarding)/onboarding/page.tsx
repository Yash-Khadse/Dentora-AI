import { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = { title: "Setup Your Study Plan" };

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OnboardingWizard />
    </div>
  );
}
