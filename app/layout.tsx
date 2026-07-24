import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme/theme-script";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drishx-web-app.vercel.app"),
  title: "Drishx",
  description: "Drishx customer portal",
  openGraph: {
    title: "Drishx",
    description: "Drishx customer portal",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 512,
        height: 512,
        alt: "Drishx",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Drishx",
    description: "Drishx customer portal",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=12", sizes: "any", type: "image/x-icon" },
      { url: "/icon-32.png?v=12", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png?v=12", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=12",
    apple: "/apple-touch-icon.png?v=12",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
