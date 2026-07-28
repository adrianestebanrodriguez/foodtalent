import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Script from "next/script";

const siteUrl = "https://foodtalent-five.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "FoodTalent - Expertos en industria alimentaria | Consultores IA",
    template: "%s | FoodTalent",
  },
  description:
    "Plataforma de matching impulsada por IA que conecta empresarios con profesionales expertos en formulación, procesos, calidad, I+D y más. Encuentra al consultor ideal para tu reto alimentario.",
  keywords: [
    "consultor industria alimentaria",
    "experto en formulación de alimentos",
    "desarrollo de productos alimenticios",
    "consultoría HACCP",
    "seguridad alimentaria",
    "I+D alimentos",
    "ingeniero de alimentos",
    "food consultant",
    "food scientist",
    "foodtalent",
    "reto alimentario",
    "innovación alimentaria",
  ],
  authors: [{ name: "FoodTalent", url: siteUrl }],
  creator: "FoodTalent / Alquimia Foods",
  publisher: "FoodTalent",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "es-CO": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "FoodTalent",
    title: "FoodTalent - Expertos en industria alimentaria | Consultores IA",
    description:
      "Encuentra al experto que resuelva tu reto en industria de alimentos. Matching impulsado por IA.",
    url: siteUrl,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FoodTalent - Expertos en industria alimentaria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FoodTalent - Expertos en industria alimentaria",
    description:
      "Plataforma de matching IA para conectar empresas de alimentos con expertos.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "FoodTalent",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description:
        "Plataforma de matching impulsada por IA que conecta empresarios con profesionales expertos en la industria de alimentos.",
      contactPoint: {
        "@type": "ContactPoint",
        email: "alquimiafoods@proton.me",
        contactType: "customer service",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "FoodTalent",
      alternateName: "FoodTalent - Expertos en industria alimentaria",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "es-CO",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${siteUrl}/#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "";

  return (
    <html lang="es">
      <head>
        <link rel="canonical" href={siteUrl} />
        <meta name="geo.country" content="CO" />
        <meta name="geo.region" content="CO" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
