import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lenz — AI Product Media",
  description: "One photo. Nine images. One video. Live listing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
