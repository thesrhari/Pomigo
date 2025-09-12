import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavBarProvider from "@/components/navbar/NavBarProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PreviewProvider } from "@/components/PreviewProvider";
import PreviewIndicator from "@/components/PreviewIndicator";
import Providers from "./providers";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pomigo - Pomodoro Study App",
  description:
    "Your study companion with Pomodoro timer, task management, and social features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreviewProvider>
      <Providers>
        <ThemeProvider>
          <html lang="en" className={geist.variable}>
            <body>
              <NavBarProvider>{children}</NavBarProvider>
              <PreviewIndicator />
            </body>
          </html>
        </ThemeProvider>
      </Providers>
    </PreviewProvider>
  );
}
