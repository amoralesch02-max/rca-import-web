import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}