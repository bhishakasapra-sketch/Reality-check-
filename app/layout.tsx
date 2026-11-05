import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { Footer, Nav } from "@/components/Nav";
import { AskWhy } from "@/components/AskWhy";

export const metadata: Metadata = {
  title: { default: "Reality Check — Understand the world. One decision at a time.", template: "%s · Reality Check" },
  description: "Explore global challenges, simulate real-world scenarios and discover the consequences of the choices that shape our future.",
  openGraph: { title: "Reality Check", description: "Understand the world. One decision at a time.", type: "website" }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧭</text></svg>" />
      </head>
      <body>
        <AppProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
          <AskWhy />
        </AppProvider>
      </body>
    </html>
  );
}
