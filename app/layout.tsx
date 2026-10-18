import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Before You Pay",
  description: "Check your size and what is really at risk before you pay for clothes online.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
