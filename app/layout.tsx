import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XAIVON | AI Solutions Consultant",
  description:
    "XAIVON is an enterprise AI solutions platform offering automation, intelligent workflows, and AI-powered consulting for logistics and hospitality businesses.",
  keywords: ["AI automation", "enterprise AI", "AI chatbot", "business automation", "XAIVON"],
  authors: [{ name: "XAIVON" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "XAIVON | AI Solutions Consultant",
    description:
      "Enterprise AI automation and intelligent workflow solutions. Talk to our AI consultant and discover what's possible.",
    url: "https://xaivon-chatbot.vercel.app",
    siteName: "XAIVON",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XAIVON | AI Solutions Consultant",
    description: "Enterprise AI automation and intelligent workflow solutions.",
  },

};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TranslationProvider>
          {children}
          <ErrorBoundary>
            <ChatWidget />
          </ErrorBoundary>
        </TranslationProvider>
      </body>
    </html>
  );
}

