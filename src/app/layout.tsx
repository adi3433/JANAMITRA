import type { Metadata } from "next";
import "./globals.css";
import { DarkModeInit } from "@/components/DarkModeInit";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";

export const metadata: Metadata = {
  title: "Janamitra — Voter Information Assistant | SVEEP Kottayam",
  description:
    "Janamitra is a bilingual (Malayalam + English) AI voter information assistant for Kottayam district. Check registration, locate polling booths, and report violations.",
  keywords: ["voter", "SVEEP", "Kottayam", "election", "polling booth", "Kerala", "Malayalam"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Janamitra",
  },
  openGraph: {
    title: "Janamitra — Voter Information Assistant",
    description: "Your impartial voter information assistant for Kottayam district.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Janamitra" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Inline script to prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=localStorage.getItem('janamitra_darkMode');if(d==='true'||(d===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        {/* Service Worker registration for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </head>
      <body className="antialiased">
        <DarkModeInit />
        <GlobalShortcuts />
        {children}
      </body>
    </html>
  );
}
