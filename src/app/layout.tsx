import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Roboto_Flex } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { Toast } from "@base-ui/react/toast";

const roboto = Roboto_Flex({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-roboto",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Mi dashboard",
  description: "Hub personal del día a día",
};

const themeScript = `(function(){try{var stored=localStorage.getItem("theme");var dark=stored?stored==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var root=document.documentElement;root.classList.toggle("dark",dark);root.setAttribute("data-theme",dark?"dark":"light");root.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={roboto.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <ClerkProvider>
          <div aria-hidden="true" className="app-backdrop" />
          <Toast.Provider timeout={4000} limit={4}>
            {children}
            <Toaster />
          </Toast.Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}
