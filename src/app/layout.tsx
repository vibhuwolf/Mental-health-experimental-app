import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MOODDROP",
  description:
    "MOODDROP is a mobile-first emotional intelligence app for check-ins, spiral support, and weekly replay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
