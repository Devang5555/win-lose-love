import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface SeoData {
  title?: string;
  description?: string;
  slug?: string;
  og_image?: string;
  canonical?: string;
  image_alt?: Record<string, string>;
}

interface SeoSectionProps {
  value: SeoData;
  onChange: (v: SeoData) => void;
  fallbackImage?: string;
}

const SeoSection = ({ value, onChange, fallbackImage }: SeoSectionProps) => {
  const set = (patch: Partial<SeoData>) => onChange({ ...value, ...patch });
  const titleLen = value.title?.length ?? 0;
  const descLen = value.description?.length ?? 0;

  return (
    <section>
      <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        SEO &amp; Social
        <span className="text-xs font-normal text-muted-foreground">(optional, overrides defaults)</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Meta Title</Label>
            <span className={`text-xs ${titleLen > 60 ? "text-destructive" : "text-muted-foreground"}`}>
              {titleLen}/60
            </span>
          </div>
          <Input
            value={value.title || ""}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Shown in Google results & browser tab"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Meta Description</Label>
            <span className={`text-xs ${descLen > 160 ? "text-destructive" : "text-muted-foreground"}`}>
              {descLen}/160
            </span>
          </div>
          <Textarea
            value={value.description || ""}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="One-line summary shown in search results"
            rows={2}
          />
        </div>

        <div>
          <Label className="mb-2 block">Slug Override</Label>
          <Input
            value={value.slug || ""}
            onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
            placeholder="custom-url-slug"
          />
        </div>

        <div>
          <Label className="mb-2 block">Canonical URL</Label>
          <Input
            value={value.canonical || ""}
            onChange={(e) => set({ canonical: e.target.value })}
            placeholder="https://gobhraman.com/..."
          />
        </div>

        <div className="md:col-span-2">
          <Label className="mb-2 block">OG / Social Share Image</Label>
          <Input
            value={value.og_image || ""}
            onChange={(e) => set({ og_image: e.target.value })}
            placeholder="https://... (defaults to first trip image)"
          />
          {(value.og_image || fallbackImage) && (
            <img
              src={value.og_image || fallbackImage}
              alt="OG preview"
              className="mt-2 w-full max-w-sm h-32 object-cover rounded-lg border border-border"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default SeoSection;
