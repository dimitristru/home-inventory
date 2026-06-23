import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/ui/Nav";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Σπιτικά | Διαχείριση αποθεμάτων",
  description: "Παρακολούθηση αποθεμάτων, λίστα αγορών και εξόδων για το σπίτι",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 flex flex-col">
        <Nav />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
          {children}
        </main>
      </body>
    </html>
  );
}
