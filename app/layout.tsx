import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ServiceWorkerBootstrap } from "@/components/pwa/sw-bootstrap";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "소독노트",
  description: "소독 방역업체를 위한 올인원 관리 플랫폼",
  manifest: "/manifest.json",
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "소독노트",
  },
};

export const viewport: Viewport = {
  themeColor: "#009098",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full">
        <ServiceWorkerBootstrap />
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { fontSize: "16px" },
          }}
        />
      <Analytics />
      </body>
    </html>
  );
}
