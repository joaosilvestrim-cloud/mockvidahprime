const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vidahprime.com.br";
export default function sitemap() {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/entrar`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/cadastro`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
