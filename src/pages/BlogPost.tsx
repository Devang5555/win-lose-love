import { useParams, Link } from "react-router-dom";
import { Calendar, User, ArrowLeft, ArrowRight } from "lucide-react";
import DOMPurify from "dompurify";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import JsonLd from "@/components/JsonLd";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useTrips } from "@/hooks/useTrips";
import { useDestinations } from "@/hooks/useDestinations";
import TripCard from "@/components/TripCard";
import { Skeleton } from "@/components/ui/skeleton";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { loading, getPostBySlug, getRelatedPosts } = useBlogPosts();
  const { trips } = useTrips();
  const { destinations } = useDestinations();

  const post = slug ? getPostBySlug(slug) : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-primary hover:underline">← Back to Blog</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedPosts = getRelatedPosts(post.id, post.destination_id);
  const destination = post.destination_id ? destinations.find(d => d.id === post.destination_id) : null;
  const relatedTrips = destination
    ? trips.filter(t => {
        // Match trips by destination_id if available from the trips table data
        return true; // We'll show a few trips as suggestions
      }).slice(0, 3)
    : trips.slice(0, 3);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.meta_description || "",
    image: post.featured_image || undefined,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "GoBhraman" },
    datePublished: post.published_at,
    dateModified: post.updated_at,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://win-lose-love.lovable.app/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://win-lose-love.lovable.app/blog" },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title={post.meta_title || `${post.title} | GoBhraman Blog`}
        description={post.meta_description || post.excerpt || ""}
        image={post.featured_image || undefined}
        type="article"
      />
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <span>/</span>
            <span className="text-foreground truncate">{post.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author}
              </span>
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title}
                width={800}
                height={450}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none text-foreground prose-headings:font-serif prose-headings:text-foreground prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content || "", {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height', 'style'],
              })
            }}
          />
        </article>

        {/* Related Trips */}
        {relatedTrips.length > 0 && (
          <section className="max-w-5xl mx-auto mt-16">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Related Trips</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedTrips.map(trip => (
                <TripCard key={trip.trip_id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-5xl mx-auto mt-16">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">More Stories</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map(rp => (
                <Link
                  key={rp.id}
                  to={`/blog/${rp.slug}`}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all"
                >
                  {rp.featured_image && (
                    <img src={rp.featured_image} alt={rp.title} loading="lazy" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-serif font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    {rp.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rp.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to Blog */}
        <div className="max-w-3xl mx-auto mt-12">
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to all posts
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
