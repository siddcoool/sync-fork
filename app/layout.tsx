import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sync Fork",
  description: "Sync any registered fork from its upstream on the owner's behalf.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@vetixy/circular-std@1.0.0/dist/index.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
