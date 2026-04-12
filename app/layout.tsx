import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "방역매니저",
  description: "소독 방역업체를 위한 올인원 관리 플랫폼",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#009098",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
