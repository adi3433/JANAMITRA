import type { Metadata } from "next";
import "./globals.css";
import { DarkModeInit } from "@/components/DarkModeInit";

export const metadata: Metadata = {
  title: "Janamitra — Voter Information Assistant | SVEEP Kottayam",
  description:
    "Janamitra is a bilingual (Malayalam + English) AI voter information assistant for Kottayam district. Check registration, locate polling booths, and report violations.",
  keywords: ["voter", "SVEEP", "Kottayam", "election", "polling booth", "Kerala", "Malayalam"],
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
        {/* Inline script to prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=localStorage.getItem('janamitra_darkMode');if(d==='true'||(d===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <DarkModeInit />
        {children}
      </body>
    </html>
  );
}
