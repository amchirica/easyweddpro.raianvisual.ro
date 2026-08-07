import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { ToastProvider } from "@/components/shared/toast-provider";
import { APP_NAME, APP_SEO_DESCRIPTION, APP_TAGLINE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/url";

import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  // Used weights: normal (400), medium (500), semibold (600)
  weight: ["400", "500", "600"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — Business OS pentru Weddings & Events`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_SEO_DESCRIPTION,
  applicationName: APP_NAME,
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
    apple: "/logo.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: siteUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — Business OS pentru Weddings & Events`,
    description: APP_TAGLINE,
    images: [{ url: "/logo.png", width: 64, height: 64, alt: APP_NAME }],
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} — Business OS pentru Weddings & Events`,
    description: APP_TAGLINE,
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${sourceSans.variable} ${cormorant.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ToastProvider>
          {children}
          <RegisterServiceWorker />
        </ToastProvider>
      </body>
    </html>
  );
}
