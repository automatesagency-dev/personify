import type { Metadata } from "next";
import { Poppins, Questrial } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/common/theme-provider";
import { Navbar } from "@/components/layout/Navbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "800"],
});

const questrial = Questrial({
  variable: "--font-questrial",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://personify.so"),
  title: {
    default: "Personify - Level Up Your Personal Brand",
    template: "%s | Personify",
  },
  description: "Skip The Photoshoot Hassle! We Generate Highly Realistic Images Of You Anywhere. Office, Beach, Studio Photoshoot... You Name It.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://personify.so",
    title: "Personify - Level Up Your Personal Brand",
    description: "Skip The Photoshoot Hassle! We Generate Highly Realistic Images Of You Anywhere.",
    siteName: "Personify",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personify - Level Up Your Personal Brand",
    description: "Skip The Photoshoot Hassle! We Generate Highly Realistic Images Of You Anywhere.",
  },
  icons: {
    icon: "/favicon/favicon.ico",
    shortcut: "/favicon/favicon-16x16.png",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${questrial.variable} antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
