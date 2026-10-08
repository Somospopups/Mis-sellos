import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Mis Sellos — la tarjeta de sellos que no se pierde",
  description:
    "Tarjeta de fidelidad digital para cafés y comercios de barrio: vive en el celular del cliente, sellás en dos toques y sabés quién dejó de venir. Sin app. Hecho por POPUPS.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Mis Sellos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
