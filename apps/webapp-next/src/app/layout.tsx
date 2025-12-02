import type { Metadata } from "next";
import "./globals.css";

import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

export const metadata: Metadata = {
  title: "ZANTARA - Bali Zero Assistant",
  description: "Your intelligent assistant for Indonesia visa, tax, and business services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
