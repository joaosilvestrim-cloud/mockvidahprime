const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vidahprime.com.br";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/conta", "/reservar", "/cadastro", "/api/"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
