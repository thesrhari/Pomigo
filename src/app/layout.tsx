import type { Metadata } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  Lora,
  IBM_Plex_Mono,
  Oxanium,
  Source_Code_Pro,
  Nunito,
  Fira_Code,
  Montserrat,
  Merriweather,
  Rajdhani,
  Orbitron,
  Share_Tech_Mono,
  Geist,
  Outfit,
  DM_Sans,
} from "next/font/google";
import "./globals.css";
import NavBarProvider from "@/components/navbar/NavBarProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PreviewProvider } from "@/components/PreviewProvider";
import PreviewIndicator from "@/components/PreviewIndicator";

// Load all fonts used in themes
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech-mono",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
      <ThemeProvider>
        <html lang="en">
          <body
            className={`
            font-sans
            ${inter.variable}
            ${plusJakartaSans.variable}
            ${lora.variable}
            ${ibmPlexMono.variable}
            ${oxanium.variable}
            ${sourceCodePro.variable}
            ${nunito.variable}
            ${firaCode.variable}
            ${montserrat.variable}
            ${merriweather.variable}
            ${rajdhani.variable}
            ${orbitron.variable}
            ${shareTechMono.variable}
            ${geist.variable}
            ${outfit.variable}
            ${dmSans.variable}
          `}
          >
            <NavBarProvider>{children}</NavBarProvider>
            <PreviewIndicator />
          </body>
        </html>
      </ThemeProvider>
    </PreviewProvider>
  );
}
