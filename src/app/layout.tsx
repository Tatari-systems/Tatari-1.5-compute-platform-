import type { Metadata } from "next";
import { Instrument_Serif, Inter, Montserrat } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-family",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-family",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-brand-family",
});

export const metadata: Metadata = {
  title: "Tatari Release A",
  description: "Internal quote-to-commit workflow foundation.",
  icons: {
    icon: "/tatari-logo.jpg",
    apple: "/tatari-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${montserrat.variable}`}
    >
      <body className="bg-bg font-sans text-text">{children}</body>
    </html>
  );
}
