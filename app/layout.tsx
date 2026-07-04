import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Our Space",
  description: "A private, cozy place for two — chat and listen together.",
  applicationName: "Our Space",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Our Space",
  },
  // Standardized equivalent of apple-mobile-web-app-capable (silences Chrome's
  // deprecation warning); the Apple tag above is kept for iOS standalone mode.
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#141010",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
