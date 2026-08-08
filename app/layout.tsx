import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import Script from "next/script";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { AppProviders } from "@/components/providers/app-providers";
import { ToastProvider } from "@/components/shared/toast-provider";
import { APP_NAME } from "@/lib/constants";
import { getRequestLocale } from "@/lib/i18n/get-locale";
import { getRequestTheme, themeAntiFlashScript } from "@/lib/i18n/get-theme";
import { getTranslator } from "@/lib/i18n/t";
import { getSiteUrl } from "@/lib/url";

import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getTranslator();
  const ogTitle = t("marketing.seo.homeOgTitle");
  const ogDescription = t("marketing.seo.homeOgDescription");
  const description = t("marketing.seo.homeDescription");

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: ogTitle,
      template: `%s · ${APP_NAME}`,
    },
    description,
    applicationName: APP_NAME,
    icons: {
      icon: "/logo.ico",
      shortcut: "/logo.ico",
      apple: "/logo.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "ro_RO",
      url: siteUrl,
      siteName: APP_NAME,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: "/logo.png", width: 64, height: 64, alt: APP_NAME }],
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: ogDescription,
      images: ["/logo.png"],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
    { media: "(prefers-color-scheme: light)", color: "#f7f3eb" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, theme] = await Promise.all([getRequestLocale(), getRequestTheme()]);

  return (
    <html
      lang={locale}
      className={`${sourceSans.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="ewp-theme-anti-flash"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeAntiFlashScript(theme) }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders locale={locale} theme={theme}>
          <ToastProvider>
            {children}
            <RegisterServiceWorker />
          </ToastProvider>
        </AppProviders>
      </body>
    </html>
  );
}
