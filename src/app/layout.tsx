import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/shared/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Dentora AI – BDS Exam Success Platform",
    template: "%s | Dentora AI",
  },
  description:
    "The ultimate AI-powered study companion for BDS final year students. Personalized study plans, viva simulator, flashcards, and exam prediction.",
  keywords: ["BDS", "dental", "exam prep", "study planner", "viva simulator", "RGUHS", "Meghna Dental"],
  authors: [{ name: "Dentora AI" }],
  creator: "Dentora AI",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Dentora AI – BDS Exam Success Platform",
    description: "AI-powered BDS final year exam preparation platform",
    siteName: "Dentora AI",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1629" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
