import type { Metadata } from "next";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";

export const metadata: Metadata = { title: "Primeiros passos" };

export default function OnboardingPage() {
  return <OnboardingScreen />;
}
