import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProxySocials",
  description: "Digital services made easy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}