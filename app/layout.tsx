import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHITUK | Scripts Loger",
  description: "Una colección local de Scripts listas para usarse",
};

export const viewport: Viewport = {
  themeColor: "#0A0F0D",
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
    >
      <body className="min-h-full flex flex-col md:flex-row bg-[#0A0F0D] text-[#E2E8F0] font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-h-screen relative">
          {children}
        </main>
      </body>
    </html>
  );
}
