import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prayer Wall",
  description: "Share and request prayers securely within your community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Decorative ambient background glows */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-theme-500/10 blur-[120px]" />
          <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] rounded-full bg-theme-500/10 blur-[100px]" />
        </div>
        
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
