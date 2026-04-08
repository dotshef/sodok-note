import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "방역매니저",
  description: "소독 방역업체를 위한 올인원 관리 플랫폼",
  manifest: "/manifest.json",
  themeColor: "#570df8",
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
