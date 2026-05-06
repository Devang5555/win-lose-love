import { useState } from "react";
import { ArrowUp, ArrowDown, Star, Trash2, Pencil, X, Plus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUpload from "./ImageUpload";

export interface ImageMeta {
  /** key = image url, value = alt text */
  alt?: Record<string, string>;
}

interface SmartImageManagerProps {
  images: string[];
  alt?: Record<string, string>;
  onImagesChange: (images: string[]) => void;
  onAltChange?: (alt: Record<string, string>) => void;
}

const SmartImageManager = ({ images, alt = {}, onImagesChange, onAltChange }: SmartImageManagerProps) => {
  const [newUrl, setNewUrl] = useState("");
  const [editingAltFor, setEditingAltFor] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState("");

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onImagesChange(next);
  };

  const setHero = (idx: number) => {
    if (idx === 0) return;
    const next = [...images];
    const [pick] = next.splice(idx, 1);
    next.unshift(pick);
    onImagesChange(next);
  };

  const remove = (idx: number) => onImagesChange(images.filter((_, i) => i !== idx));

  const add = (url: string) => {
    const u = url.trim();
    if (!u || images.includes(u)) return;
    onImagesChange([...images, u]);
    setNewUrl("");
  };

  const saveAlt = (url: string) => {
    onAltChange?.({ ...alt, [url]: altDraft });
    setEditingAltFor(null);
    setAltDraft("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2 flex-1">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste image URL..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(newUrl))}
          />
          <Button type="button" onClick={() => add(newUrl)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ImageUpload onUploaded={(url) => add(url)} />
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No images yet. Upload or paste a URL above.
        </div>
      ) : (
        <ul className="space-y-2">
          {images.map((url, i) => {
            const isHero = i === 0;
            const altText = alt[url] || "";
            const isEditingAlt = editingAltFor === url;
            return (
              <li
                key={url}
                className={`flex flex-col sm:flex-row gap-3 items-stretch sm:items-center rounded-xl border p-2 ${
                  isHero ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={url} alt={altText || `Image ${i + 1}`} className="w-24 h-16 object-cover rounded-lg" />
                  {/* Mobile crop preview overlay */}
                  <div className="absolute inset-0 ring-2 ring-inset ring-white/40 pointer-events-none" />
                  {isHero && (
                    <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      HERO
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{url}</p>
                  {isEditingAlt ? (
                    <div className="flex gap-1 mt-1">
                      <Input
                        value={altDraft}
                        onChange={(e) => setAltDraft(e.target.value)}
                        placeholder="Alt text for accessibility & SEO"
                        className="h-7 text-xs"
                        autoFocus
                      />
                      <Button size="sm" className="h-7 px-2" onClick={() => saveAlt(url)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingAltFor(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingAltFor(url); setAltDraft(altText); }}
                      className="text-xs text-foreground hover:text-primary inline-flex items-center gap-1 mt-0.5"
                    >
                      <Pencil className="w-3 h-3" />
                      <span className={altText ? "" : "italic text-muted-foreground"}>
                        {altText || "Add alt text"}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex gap-0.5 justify-end">
                  <Button type="button" variant="ghost" size="sm" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" title="Move down" onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" title="Set as hero" onClick={() => setHero(i)} disabled={isHero}>
                    <Star className={`w-4 h-4 ${isHero ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" title="Delete" className="text-destructive hover:text-destructive" onClick={() => remove(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        First image is the hero / OG fallback. Reorder with arrows. Add alt text to boost accessibility & SEO.
      </p>
    </div>
  );
};

export default SmartImageManager;
