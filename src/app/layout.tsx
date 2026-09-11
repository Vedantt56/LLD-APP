import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLD Practice Platform",
  description: "Object-Oriented Low Level Design Practice & Evaluation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
