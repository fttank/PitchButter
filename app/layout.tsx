import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pitch Butter",
  description: "Fast, smart, client-winning proposals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[#0E0C10] text-[var(--color-text-light)] relative overflow-x-hidden`}
      >
        <div className="ai-grid-bg absolute inset-0 -z-10" />

        <Navbar />

        <main className="flex-grow pt-20 px-4 sm:px-8 md:px-12">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
