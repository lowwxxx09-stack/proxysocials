import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteVisitTracker from "@/components/SiteVisitTracker";

export const metadata: Metadata = {
  title: "ProxySocials",
  description: "Digital services made easy",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteVisitTracker />
        {children}
      </body>
    </html>
  );
}