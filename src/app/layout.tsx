import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tatari Release A",
  description: "Internal quote-to-commit workflow foundation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
