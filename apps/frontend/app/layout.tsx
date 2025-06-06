import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "../src/context/ChatContext";
import ClientProviders from "../src/components/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Objection! AI",
  description: "A blockchain-powered courtroom for human vs AI detection - Present your case and prove your opponent's true nature!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ClientProviders>
          <ChatProvider>
            {children}
          </ChatProvider>
        </ClientProviders>
      </body>
    </html>
  );
}