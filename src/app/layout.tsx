import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Mi dashboard",
  description: "Hub personal del día a día",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </body>
    </html>
  );
}