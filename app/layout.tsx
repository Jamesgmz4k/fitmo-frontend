import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Usamos Inter como pediste anteriormente
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fitmo",
  description: "Plataforma de análisis de sobrecarga progresiva",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}