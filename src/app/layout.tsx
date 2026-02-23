import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kpop Nara Photoism",
  description: "Queue for Photoism booths at Kpop Nara",
  icons: { icon: "/kpopnara-logo.png", apple: "/kpopnara-logo.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
