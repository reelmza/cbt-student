import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/sections/side-bar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
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
    <html
      lang="en"
      data-school={(process.env.SCHOOL_NAME || "default").toLowerCase()}
    >
      <body
        className={`${inter.variable} ${merriweather.variable} antialiased`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-center h-full w-full">
          <SideBar />
          {children}
        </div>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
