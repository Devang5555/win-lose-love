import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ParallaxImageProps {
  src: string;
  alt?: string;
  /** Parallax intensity in px of total travel. Higher = more movement. */
  intensity?: number;
  className?: string;
  /** Optional overlay content rendered above the image (headline etc). */
  children?: React.ReactNode;
  /** Aspect ratio utility class for the frame. */
  aspect?: string;
  rounded?: string;
}

/**
 * Lightweight scroll parallax block — no animation libraries.
 * Uses a single rAF-throttled scroll listener and transforms only while
 * the element is near the viewport. Respects prefers-reduced-motion.
 */
const ParallaxImage = ({
  src,
  alt = "",
  intensity = 60,
  className,
  children,
  aspect = "aspect-[21/9]",
  rounded = "rounded-3xl",
}: ParallaxImageProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;

    let ticking = false;
    let visible = false;

    const apply = () => {
      ticking = false;
      const rect = frame.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // progress: 0 when entering bottom, 1 when leaving top
      const progress = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.min(1, Math.max(0, progress));
      const offset = (clamped - 0.5) * intensity;
      img.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.18)`;
    };

    const onScroll = () => {
      if (!visible || ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) apply();
      },
      { threshold: 0 }
    );
    io.observe(frame);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, intensity]);

  return (
    <div
      ref={frameRef}
      className={cn("relative w-full overflow-hidden bg-muted shadow-card", aspect, rounded, className)}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ transform: "scale(1.18)" }}
      />
      {children && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-end p-6 md:p-10">{children}</div>
        </>
      )}
    </div>
  );
};

export default ParallaxImage;
