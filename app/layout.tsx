import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getSiteUrl } from "@/lib/config";
import { XAIVON_APPROVED_FACTS } from "@/lib/knowledge/XAIVON_APPROVED_FACTS";

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: "XAIVON | AI Business Infrastructure & Workflow Automation",
    description:
      "XAIVON designs and deploys production-grade AI infrastructure, intelligent workflow automations, and domain conversational assistants for modern businesses.",
    keywords: [
      "AI automation",
      "workflow orchestration",
      "logistics automation",
      "freight AI",
      "AI business consultant",
      "enterprise AI",
      "XAIVON",
    ],
    authors: [{ name: "XAIVON" }],
    robots: { index: true, follow: true },
    icons: {
      icon: "/favicon.svg",
      apple: "/favicon.svg",
    },
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: "XAIVON | AI Business Infrastructure & Workflow Automation",
      description:
        "Practical AI assistance and connected automation built around real business operations. Talk to our AI Business Consultant.",
      url: siteUrl,
      siteName: "XAIVON",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "XAIVON AI Business Infrastructure",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "XAIVON | AI Business Infrastructure & Workflow Automation",
      description:
        "Practical AI assistance and connected automation built around real business operations.",
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0E12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: XAIVON_APPROVED_FACTS.brandName,
    legalName: XAIVON_APPROVED_FACTS.legalEntity,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "XAIVON is an AI business infrastructure company designing workflow automation, connected systems, and practical AI assistance.",
    email: XAIVON_APPROVED_FACTS.email,
    telephone: XAIVON_APPROVED_FACTS.phone,
    founder: {
      "@type": "Person",
      name: XAIVON_APPROVED_FACTS.founder,
      jobTitle: XAIVON_APPROVED_FACTS.founderTitle,
    },
  };

  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
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
