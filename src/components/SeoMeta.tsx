import { useEffect } from "react";

interface SeoMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
}

const SITE_ORIGIN = "https://win-lose-love.lovable.app";

const SeoMeta = ({ title, description, image, url, type = "website", canonical }: SeoMetaProps) => {
  useEffect(() => {
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (property.startsWith("og:")) {
          el.setAttribute("property", property);
        } else {
          el.setAttribute("name", property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const resolvedUrl = url || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : undefined);
    const resolvedCanonical = canonical || resolvedUrl || (typeof window !== "undefined"
      ? SITE_ORIGIN + window.location.pathname
      : undefined);

    document.title = title;

    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:type", type);
    if (image) setMeta("og:image", image);
    if (resolvedUrl) setMeta("og:url", resolvedUrl);

    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    setMeta("description", description);

    if (resolvedCanonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", resolvedCanonical);
    }

    return () => {
      document.title = "GoBhraman | Curated Trips Across India";
    };
  }, [title, description, image, url, type, canonical]);

  return null;
};

export default SeoMeta;
