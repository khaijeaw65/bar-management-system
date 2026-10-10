import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Loft Bar",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-bg-app font-sans text-text-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
