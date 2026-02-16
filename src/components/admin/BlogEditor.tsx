import { useState, memo } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, ArrowLeft, Globe, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBlogPosts, BlogPost } from "@/hooks/useBlogPosts";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface BlogEditorProps {
  destinations: { id: string; name: string }[];
}

const BlogEditor = ({ destinations }: BlogEditorProps) => {
  const { toast } = useToast();
  const { posts, loading, fetchPosts } = useBlogPosts();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [author, setAuthor] = useState("GoBhraman Team");
  const [destinationId, setDestinationId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);

  const resetForm = () => {
    setTitle(""); setSlug(""); setExcerpt(""); setContent("");
    setFeaturedImage(""); setMetaTitle(""); setMetaDescription("");
    setAuthor("GoBhraman Team"); setDestinationId(""); setIsPublished(false);
    setEditing(null); setIsNew(false);
  };

  const loadPost = (post: BlogPost) => {
    setEditing(post);
    setIsNew(false);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setContent(post.content || "");
    setFeaturedImage(post.featured_image || "");
    setMetaTitle(post.meta_title || "");
    setMetaDescription(post.meta_description || "");
    setAuthor(post.author);
    setDestinationId(post.destination_id || "");
    setIsPublished(post.is_published);
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({ title: "Error", description: "Title and slug are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const postData: Record<string, any> = {
      title,
      slug,
      excerpt: excerpt || null,
      content: content || null,
      featured_image: featuredImage || null,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      author,
      destination_id: destinationId || null,
      is_published: isPublished,
      published_at: isPublished ? (editing?.published_at || new Date().toISOString()) : null,
    };

    let error;
    if (isNew) {
      ({ error } = await (supabase.from("blog_posts" as any).insert(postData) as any));
    } else if (editing) {
      ({ error } = await (supabase.from("blog_posts" as any).update(postData).eq("id", editing.id) as any));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `Blog post ${isNew ? "created" : "updated"} successfully.` });
      resetForm();
      fetchPosts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post permanently?")) return;
    const { error } = await (supabase.from("blog_posts" as any).delete().eq("id", id) as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Blog post removed." });
      fetchPosts();
    }
  };

  // Editor view
  if (editing || isNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={resetForm} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Posts
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label className="text-sm">{isPublished ? "Published" : "Draft"}</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Post"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (isNew) setSlug(generateSlug(e.target.value));
                }}
                placeholder="Your blog post title"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-friendly-slug" />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary for cards..." rows={3} />
            </div>
            <div>
              <Label>Content</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Media
              </h3>
              <div>
                <Label>Featured Image URL</Label>
                <Input value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} placeholder="https://..." />
                {featuredImage && (
                  <img src={featuredImage} alt="Preview" className="mt-2 rounded-lg w-full h-32 object-cover" />
                )}
              </div>
              <div>
                <Label>Author</Label>
                <Input value={author} onChange={e => setAuthor(e.target.value)} />
              </div>
              <div>
                <Label>Destination</Label>
                <Select value={destinationId} onValueChange={setDestinationId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {destinations.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" /> SEO
              </h3>
              <div>
                <Label>Meta Title <span className="text-xs text-muted-foreground">({metaTitle.length}/60)</span></Label>
                <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder={title} maxLength={60} />
              </div>
              <div>
                <Label>Meta Description <span className="text-xs text-muted-foreground">({metaDescription.length}/160)</span></Label>
                <Textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder={excerpt} maxLength={160} rows={3} />
              </div>
              {/* SEO Preview */}
              <div className="border border-border rounded-lg p-3 bg-background">
                <p className="text-xs text-muted-foreground mb-1">Search preview</p>
                <p className="text-sm text-primary font-medium truncate">{metaTitle || title || "Blog Post Title"}</p>
                <p className="text-xs text-primary/70 truncate">win-lose-love.lovable.app/blog/{slug || "slug"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{metaDescription || excerpt || "Post description..."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Post list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-foreground">Blog Posts</h2>
        <Button onClick={() => { resetForm(); setIsNew(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground mb-4">No blog posts yet.</p>
          <Button onClick={() => { resetForm(); setIsNew(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Create your first post
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div
              key={post.id}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
            >
              {post.featured_image && (
                <img src={post.featured_image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                  <Badge variant={post.is_published ? "default" : "secondary"} className="flex-shrink-0">
                    {post.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  /blog/{post.slug} · {post.author} · {new Date(post.updated_at).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {post.is_published && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => loadPost(post)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(BlogEditor);
