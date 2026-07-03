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
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#120913",
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
