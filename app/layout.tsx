import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const sans = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sejan · Blog",
  description: "WordPress-powered blog front page",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        {children}
        <Script
          src="//pl8212799.effectivegatecpm.com/dd/87/e0/dd87e0d92f96702bf7cba66aa4d3d810.js"
          strategy="afterInteractive"
        />
        <Script
          src="//pl15724785.effectivegatecpm.com/fa/3d/1e/fa3d1e8c202a6156bf8737806f3e6367.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
