import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBarProvider from "@/components/navbar/NavBarProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pomigo - Pomodoro Study App",
  description:
    "A comprehensive study companion with Pomodoro timer, task management, and social features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <html lang="en">
        <body className={inter.className}>
          <NavBarProvider>{children}</NavBarProvider>
        </body>
      </html>
    </ThemeProvider>
  );
}
