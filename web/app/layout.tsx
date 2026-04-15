import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guardrail Failure Lab",
  description: "An intentionally vulnerable chatbot demo for prompt injection workshops."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
