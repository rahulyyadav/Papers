import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sacramento } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sacramento = Sacramento({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sacramento",
});

export const metadata: Metadata = {
  title: "Uni-Papers",
  description: "Share Past Exam Papers, Earn Revenue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Analytics />
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased ${sacramento.variable}`}
        >
          {children}
        </body>
      </html>
    </>
  );
}
