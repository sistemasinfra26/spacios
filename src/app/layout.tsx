import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spacio | Software de Gestión de Consorcios y Alquileres",
  description: "La plataforma integral B2B para administraciones, consorcios y gestión de alquileres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="antialiased min-h-screen bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}