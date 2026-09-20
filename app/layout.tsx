import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { ContentProvider } from "@/lib/contentContext";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WDT Guardians",
    template: "%s · WDT Guardians",
  },
  description:
    "Join WDT Guardians, the recurring membership program of Watchdog Thailand Foundation. Support verification, coordination, field response, and evidence follow-up for stray-animal protection in Chiang Mai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${inter.variable} min-h-screen font-sans antialiased`}>
        <ContentProvider>
          {children}
          <Toaster />
        </ContentProvider>
      </body>
    </html>
  );
}
