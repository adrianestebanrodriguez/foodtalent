import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "FoodTalent - Expertos en industria alimentaria",
  description:
    "Plataforma de matching impulsada por IA que conecta empresarios con profesionales expertos en la industria de alimentos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          Saltar al contenido principal
        </a>
        <NavBar />
        <main id="contenido-principal">{children}</main>
        <footer className="border-t border-slate-800 bg-slate-950 py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>&copy; {new Date().getFullYear()} FoodTalent / Alquimia Foods</span>
            <a href="/terminos" className="hover:text-emerald-400 transition-colors">Términos y Condiciones</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
