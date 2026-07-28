import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Script from "next/script";

const siteUrl = "https://foodtalent-five.vercel.app";

function extractGaId(raw: string): string {
  const match = raw.match(/[GA|G]-[A-Z0-9]+/);
  return match ? match[0] : "";
}

export const metadata: Metadata = {
  title: {
    default: "FoodTalent | Encuentra expertos en alimentos en Latam (HACCP, calidad, I+D)",
    template: "%s | FoodTalent",
  },
  description:
    "Conecta con ingenieros de alimentos y consultores especializados en HACCP, inocuidad, formulación, calidad e I+D en Latinoamérica. Matching por IA: describe tu reto de planta y te conectamos con el profesional correcto en minutos.",
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
      "es-419": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_419",
    siteName: "FoodTalent",
    title: "FoodTalent | Encuentra expertos en alimentos en Latam (HACCP, calidad, I+D)",
    description:
      "Conecta con ingenieros de alimentos y consultores en HACCP, inocuidad, formulación, calidad e I+D en Latinoamérica. Matching por IA.",
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
    title: "FoodTalent | Encuentra expertos en alimentos en Latam",
    description:
      "Conecta con ingenieros de alimentos y consultores en HACCP, inocuidad, formulación, calidad e I+D en Latinoamérica.",
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
        "Plataforma de matching impulsada por IA que conecta empresarios con profesionales expertos en la industria de alimentos en Latinoamérica.",
      contactPoint: {
        "@type": "ContactPoint",
        email: "alquimiafoods@proton.me",
        contactType: "customer service",
      },
      sameAs: [
        "https://www.linkedin.com/company/foodtalent",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "FoodTalent",
      alternateName: "FoodTalent - Expertos en industria alimentaria",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "es-419",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = extractGaId(process.env.NEXT_PUBLIC_GA_ID || "");

  return (
    <html lang="es">
      <head>
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
