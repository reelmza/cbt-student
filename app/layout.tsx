import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/sections/side-bar";
import { Toaster } from "@/components/ui/sonner";
import { fetchSchoolName } from "@/lib/getSchoolName";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schoolName = await fetchSchoolName();

  return (
    <html
      lang="en"
      data-school={(schoolName || "default").toLowerCase()}
    >
      <body
        className={`${inter.variable} ${merriweather.variable} antialiased`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-center h-full w-full">
          <SideBar schoolName={schoolName} />
          {children}
        </div>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
