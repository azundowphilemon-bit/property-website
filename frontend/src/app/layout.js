import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Falibari Real Estate | Premium Properties",
  description: "Find your dream home with Falibari Real Estate Management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
