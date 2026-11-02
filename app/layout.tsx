import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import AuthButton from "@/components/AuthButton";

export const metadata: Metadata = {
  title: "Before You Pay — see what you'd lose if the size fails",
  description:
    "Upload your checkout screenshot and see, before paying, the pesos you'd lose if the size fails under that store's real return rule.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-navy">
              Before You Pay
            </Link>
            <nav className="flex items-center gap-3 text-sm sm:gap-5">
              <Link href="/product" className="font-semibold text-navy hover:underline">Check</Link>
              <Link href="/history" className="text-mute hover:text-navy">History</Link>
              <Link href="/about" className="hidden text-mute hover:text-navy sm:inline">About</Link>
              <AuthButton />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</main>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-mute">
            <span>No store pays us. No affiliate links. We never recommend a product.</span>
            <span className="flex gap-3">
              <Link href="/about" className="hover:text-navy">About</Link>
              <Link href="/privacy" className="hover:text-navy">Privacy</Link>
              <a href="https://github.com/KaromBuilds/before-you-pay" className="hover:text-navy">Code</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
