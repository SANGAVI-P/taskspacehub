import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import { AppProvider } from "../context/AppContext";
import { AppLayout } from "../components/layout/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "TASK SPACE HUB - Premium SaaS Task Management",
  description: "Modern, high-performance task management workflow platform built on Next.js 15 and Tailwind CSS.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <AppProvider>
            <AppLayout>{children}</AppLayout>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
