import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../src/context/AuthContext";
import { SuiWalletProvider } from "../src/context/WalletProvider";
import { ChatProvider } from "../src/context/ChatContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TuriCheck",
  description: "A streamlined 'Human or AI?' one-shot chat experience on Sui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SuiWalletProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </SuiWalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
