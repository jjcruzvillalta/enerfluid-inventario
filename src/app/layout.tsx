
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enerfluid Apps",
  description: "Plataforma integral de Enerfluid",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/enerfluid-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/enerfluid-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/enerfluid-icon-192.png",
    apple: "/enerfluid-icon-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
