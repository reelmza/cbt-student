import type { Metadata } from "next";
import { Inter, Noto_Serif } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/sections/side-bar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const noto = Noto_Serif({
  variable: "--font-noto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CBT V2",
  description:
    "An offline CBT web application for conducting and managing exams in Nigerian tertiary institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${noto.variable} antialiased`}>
        <div className="flex flex-col lg:flex-row items-center justify-center h-full w-full">
          <SideBar />
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
