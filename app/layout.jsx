import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vidahprime.com.br";

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Vidah Prime — Coworking para saúde, bem-estar e estética em Sorocaba",
    template: "%s · Vidah Prime",
  },
  description:
    "Salas planejadas e equipadas para profissionais da saúde, bem-estar e estética em Sorocaba. Cadastro seguro, contrato único e reserva por hora, período flex ou período fixo.",
  keywords: [
    "coworking saúde Sorocaba","aluguel de consultório Sorocaba","sala para psicólogo",
    "consultório odontológico por hora","sala para nutricionista","espaço para estética","Vidah Prime",
  ],
  openGraph: {
    type: "website", locale: "pt_BR", url: SITE, siteName: "Vidah Prime",
    title: "Vidah Prime — Coworking para saúde, bem-estar e estética",
    description: "Consultórios equipados para alugar por hora, período flex ou fixo em Sorocaba.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE },
};

export const viewport = { themeColor: "#4E4B8E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              name: "Vidah Prime",
              description: "Coworking para profissionais de saúde, bem-estar e estética.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Av. General Osório, 736",
                addressLocality: "Sorocaba",
                addressRegion: "SP",
                postalCode: "18060-502",
                addressCountry: "BR",
              },
              telephone: "+55 15 3211-0277",
              url: SITE,
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
