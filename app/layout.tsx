import type { Metadata } from "next";
import { Archivo, Inter, Noto_Sans_Thai } from "next/font/google";
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

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-thai",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${archivo.variable} ${inter.variable} ${notoSansThai.variable} min-h-screen font-sans antialiased`}
      >
        <ContentProvider>
          {children}
          <Toaster />
        </ContentProvider>
      </body>
    </html>
  );
}
