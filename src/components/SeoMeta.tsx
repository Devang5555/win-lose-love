import { useEffect } from "react";

interface SeoMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

const SeoMeta = ({ title, description, image, url, type = "website" }: SeoMetaProps) => {
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

    document.title = title;

    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:type", type);
    if (image) setMeta("og:image", image);
    if (url) setMeta("og:url", url);

    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    setMeta("description", description);

    return () => {
      document.title = "GoBhraman - Adventure Travel";
    };
  }, [title, description, image, url, type]);

  return null;
};

export default SeoMeta;
