import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RCA IMPORT | Tecnología importada en Perú",
  description:
    "Catálogo oficial de RCA IMPORT. iPhones, accesorios, tecnología, productos importados y ventas al por mayor con envíos a todo el Perú.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
