import { Helmet } from "react-helmet-async";

export const SITE_NAME = "Akademee";
export const SITE_URL = "https://akademee.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/pwa-512x512.png`;

/**
 * Per-route document head: title, meta description, canonical URL,
 * Open Graph / Twitter cards, and optional robots directives / JSON-LD.
 *
 * `path` must be the route's canonical path (e.g. "/", "/login") — it is
 * combined with SITE_URL to build the canonical link and og:url. Pass a
 * full absolute `url` instead when the page lives on a school subdomain
 * (e.g. the public school website) rather than the main marketing domain.
 */
export default function Seo({
  title,
  description,
  path = "/",
  url,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd = null,
}) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url || `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
