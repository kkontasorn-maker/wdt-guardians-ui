import type { Metadata } from "next";
import localFont from "next/font/local";
import { ContentProvider } from "@/lib/contentContext";
import { TermsProvider } from "@/lib/termsContent";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const archivo = localFont({
  src: [
    { path: "./fonts/archivo-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/archivo-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "./fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const notoSansThai = localFont({
  src: [
    { path: "./fonts/noto-sans-thai-thai-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/noto-sans-thai-thai-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/noto-sans-thai-thai-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/noto-sans-thai-thai-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/noto-sans-thai-thai-800-normal.woff2", weight: "800", style: "normal" },
  ],
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
          <TermsProvider>
            {children}
            <Toaster />
          </TermsProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
