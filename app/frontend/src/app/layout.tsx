import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Loft Bar",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-bg font-sans text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
