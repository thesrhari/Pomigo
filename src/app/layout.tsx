import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavBarProvider from "@/components/navbar/NavBarProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PreviewProvider } from "@/components/PreviewProvider";
import PreviewIndicator from "@/components/PreviewIndicator";
import Providers from "./providers";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";

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
    <html lang="en" className={geist.variable}>
      <body>
        <Providers>
          <UserPreferencesProvider>
            <PreviewProvider>
              <ThemeProvider>
                <NavBarProvider>{children}</NavBarProvider>
                <PreviewIndicator />
              </ThemeProvider>
            </PreviewProvider>
          </UserPreferencesProvider>
        </Providers>
      </body>
    </html>
  );
}
