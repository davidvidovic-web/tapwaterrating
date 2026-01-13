import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tapwaterrating.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TapWaterRating (TWR) - Check tap water safety worldwide",
    template: "%s | TapWaterRating",
  },
  description:
    "Discover tap water quality and safety ratings for cities worldwide. Community-driven reviews, official safety data, and interactive maps help you make informed decisions about drinking tap water.",
  keywords: [
    "tap water",
    "water quality",
    "water safety",
    "drinking water",
    "water ratings",
    "travel water safety",
    "city water quality",
    "water reviews",
    "safe drinking water",
    "water testing",
  ],
  authors: [{ name: "TapWaterRating Team" }],
  creator: "TapWaterRating",
  publisher: "TapWaterRating",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "TapWaterRating",
    title: "TapWaterRating - Check tap water safety world wide",
    description:
      "Discover tap water quality and safety ratings for cities worldwide. Community-driven reviews and official safety data.",
    images: [
      {
        url: "/save-glass.png",
        width: 1200,
        height: 630,
        alt: "TapWaterRating - Check Water Safety",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TapWaterRating - Check tap water safety world wide",
    description:
      "Discover tap water quality and safety ratings for cities worldwide. Community-driven reviews and official safety data.",
    images: ["/save-glass.png"],
    creator: "@tapwaterrating",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons */}
        {/* Favicons configured in metadata */}

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />

        {/* Preload critical map tiles for LCP optimization */}
        <link rel="preconnect" href="https://a.tile.openstreetmap.org" />
        <link rel="preconnect" href="https://b.tile.openstreetmap.org" />
        <link rel="preconnect" href="https://c.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://a.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://b.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://c.tile.openstreetmap.org" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "TapWaterRating",
              "url": "${SITE_URL}",
              "description": "Discover tap water quality and safety ratings for cities worldwide. Community-driven reviews, official safety data, and interactive maps.",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1247",
                "bestRating": "5",
                "worstRating": "1"
              },
              "featureList": [
                "Interactive water quality map",
                "City-specific water safety ratings",
                "Community reviews and feedback",
                "Official water quality metrics",
                "Location-based recommendations"
              ]
            }
          `}
        </Script>

        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
