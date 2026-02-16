import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import JsonLd from "@/components/JsonLd";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  const { loading, getPublishedPosts } = useBlogPosts();
  const posts = getPublishedPosts();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://win-lose-love.lovable.app/" },
      { "@type": "ListItem", position: 2, name: "Blog" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title="Travel Blog & Guides | GoBhraman"
        description="Explore travel stories, destination guides, and tips from the GoBhraman team. Plan your next adventure with expert insights."
      />
      <JsonLd data={breadcrumbLd} />
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Travel Stories & Guides
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Insights, itineraries, and inspiration from our journeys across India.
            </p>
          </header>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No blog posts published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {posts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  {post.featured_image && (
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        loading="lazy"
                        width={600}
                        height={340}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-xl font-bold text-card-foreground group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                    )}
                    <span className="inline-flex items-center text-sm font-semibold text-primary gap-1 group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
