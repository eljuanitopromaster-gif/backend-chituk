import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./components/AuthProvider";
import AuthModal from "./components/AuthModal";
import ThemeModalWrapper from "./components/ThemeModalWrapper";
import ProfileModalWrapper from "./components/ProfileModalWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import PageTransition from "./components/PageTransition";

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
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('chituk_theme') || 'predeterminado';
                document.documentElement.setAttribute('data-theme', savedTheme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="h-full flex flex-col bg-base text-foreground font-sans overflow-hidden">
        <AuthProvider>
          <Navbar />
          <div className="flex-1 flex min-h-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative w-full">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>
          <AuthModal />
          <ThemeModalWrapper />
          <ProfileModalWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
