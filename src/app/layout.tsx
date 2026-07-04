import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Autopilot — AI Operating System for Founders",
  description: "The elite AI assistant that captures tasks via voice or text, auto-schedules your day, and syncs to your calendar. Built for busy founders.",
  openGraph: {
    title: "Autopilot — AI Operating System for Founders",
    description: "Capture thoughts, automate tasks, schedule your entire life — without lifting a finger.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autopilot — AI Operating System",
    description: "The elite AI assistant that runs your schedule autonomously.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col bg-[#0d0d1f]`}>
        {children}
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
