import ScrollReveal from "@/components/ScrollReveal";
import ParallaxImage from "@/components/ParallaxImage";

export interface Story {
  image: string;
  headline: string;
  description?: string;
}

interface StoryGalleryProps {
  stories: Story[];
  title?: string;
  subtitle?: string;
  alt?: string;
}

/**
 * Premium travel-storytelling section. Alternating zigzag image/text blocks
 * with subtle scroll reveals and parallax imagery. Lightweight — no heavy
 * animation libraries. Users scroll through the destination story naturally.
 */
const StoryGallery = ({ stories, title, subtitle, alt = "Story" }: StoryGalleryProps) => {
  const valid = stories.filter((s) => s.image && s.headline);
  if (valid.length === 0) return null;

  return (
    <section className="my-12 md:my-16">
      {(title || subtitle) && (
        <ScrollReveal>
          <div className="mb-8 md:mb-10 text-center max-w-2xl mx-auto">
            {title && (
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-muted-foreground mt-3 leading-relaxed">{subtitle}</p>}
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-12 md:space-y-20">
        {valid.map((story, i) => {
          const flip = i % 2 === 1;
          return (
            <div
              key={story.image + i}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center"
            >
              <ScrollReveal
                direction={flip ? "left" : "right"}
                className={flip ? "md:order-2" : "md:order-1"}
              >
                <ParallaxImage
                  src={story.image}
                  alt={`${alt} — ${story.headline}`}
                  aspect="aspect-[4/3]"
                  intensity={50}
                />
              </ScrollReveal>

              <ScrollReveal
                delay={0.1}
                direction={flip ? "right" : "left"}
                className={flip ? "md:order-1" : "md:order-2"}
              >
                <div className="md:px-2">
                  <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                    {String(i + 1).padStart(2, "0")} — Chapter
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-snug mb-3">
                    {story.headline}
                  </h3>
                  {story.description && (
                    <p className="text-muted-foreground leading-relaxed">{story.description}</p>
                  )}
                </div>
              </ScrollReveal>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StoryGallery;
