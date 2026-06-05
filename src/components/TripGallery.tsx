import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Play, Pause, Grid3x3, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TripGalleryProps {
  images: string[];
  alt?: string;
  altMap?: Record<string, string>;
}

/** Max photos shown in the desktop masonry wall before "+N more". */
const MASONRY_LIMIT = 9;

/* ------- Hero corner button: opens lightbox on the hero ------- */
export const HeroGalleryButton = ({
  images,
  alt = "Photo",
  altMap,
}: TripGalleryProps) => {
  const [open, setOpen] = useState(false);
  if (!images || images.length < 2) return null;
  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="absolute bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-background/85 backdrop-blur-md px-4 py-2 text-xs font-semibold text-foreground shadow-lg hover:bg-background border border-border/40 transition-all hover:scale-105"
      >
        <Grid3x3 className="w-3.5 h-3.5" />
        View all {images.length} photos
      </button>
      <Lightbox open={open} onClose={() => setOpen(false)} images={images} alt={alt} altMap={altMap} initial={0} />
    </>
  );
};

/* ------- Below-hero gallery: thumb strip + grid + lightbox ------- */
const TripGallery = ({ images, alt = "Photo", altMap }: TripGalleryProps) => {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  if (!images || images.length < 2) return null;

  // Skip first (hero) for the "more photos" gallery — feels more curated
  const rest = images.slice(1);

  const openAt = (idx: number) => {
    setStartIndex(idx);
    setOpen(true);
  };

  return (
    <section className="mt-8 lg:mt-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground leading-tight">Gallery</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{images.length} photos from this journey</p>
        </div>
        <button
          onClick={() => openAt(0)}
          className="text-sm font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
        >
          <Expand className="w-4 h-4" />
          View all
        </button>
      </div>

      {/* Mobile: horizontal snap strip */}
      <div
        ref={stripRef}
        className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {rest.map((src, i) => (
          <button
            key={src + i}
            onClick={() => openAt(i)}
            className="snap-center flex-shrink-0 w-[82%] aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-soft active:scale-[0.98] transition-transform"
          >
            <img
              src={src}
              alt={altMap?.[src] || `${alt} ${i + 2}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Desktop: lazy masonry photo wall */}
      <div className="hidden md:block">
        <div className="columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
          {rest.slice(0, MASONRY_LIMIT).map((src, i) => {
            const isLast = i === Math.min(rest.length, MASONRY_LIMIT) - 1;
            const overflow = rest.length - MASONRY_LIMIT;
            return (
              <button
                key={src + i}
                onClick={() => openAt(i)}
                className="group relative mb-3 block w-full overflow-hidden rounded-2xl bg-muted shadow-soft break-inside-avoid"
              >
                <img
                  src={src}
                  alt={altMap?.[src] || `${alt} ${i + 2}`}
                  loading="lazy"
                  className={cn(
                    "w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105",
                    i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-[4/3]" : "aspect-square"
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isLast && overflow > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px] text-white font-semibold text-lg gap-2">
                    <Grid3x3 className="w-5 h-5" />+{overflow} more
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Lightbox open={open} onClose={() => setOpen(false)} images={images} alt={alt} altMap={altMap} initial={startIndex + 1} />
    </section>
  );
};

/* ------- Lightbox ------- */
interface LightboxProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  alt?: string;
  altMap?: Record<string, string>;
  initial?: number;
}

const Lightbox = ({ open, onClose, images, alt = "Photo", altMap, initial = 0 }: LightboxProps) => {
  const [idx, setIdx] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setIdx(initial);
  }, [open, initial]);

  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, next, prev, onClose]);

  useEffect(() => {
    if (!open || !playing) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [open, playing, next]);

  if (!open) return null;

  const current = images[idx];

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-fade-in flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium opacity-80">
          {idx + 1} / {images.length}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/15 rounded-full"
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "Pause slideshow" : "Play slideshow"}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/15 rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image stage */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
          touchStartX.current = null;
        }}
      >
        <img
          key={current}
          src={current}
          alt={altMap?.[current] || `${alt} ${idx + 1}`}
          className="max-w-full max-h-full object-contain animate-fade-in select-none"
          draggable={false}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="px-3 pb-4 pt-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setIdx(i)}
                className={cn(
                  "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  i === idx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripGallery;
