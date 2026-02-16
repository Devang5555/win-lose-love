import { useEffect, useRef } from "react";

interface JsonLdProps {
  data: Record<string, any>;
}

const JsonLd = ({ data }: JsonLdProps) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Remove previous script if exists
    if (scriptRef.current) {
      scriptRef.current.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      script.remove();
    };
  }, [data]);

  return null;
};

export default JsonLd;
