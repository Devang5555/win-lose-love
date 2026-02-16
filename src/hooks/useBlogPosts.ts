import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author: string;
  destination_id: string | null;
  published_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("blog_posts" as any)
      .select("*")
      .order("published_at", { ascending: false }) as any);

    if (!error && data) {
      setPosts(data as BlogPost[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const getPublishedPosts = useCallback(() => {
    return posts.filter(p => p.is_published);
  }, [posts]);

  const getPostBySlug = useCallback((slug: string) => {
    return posts.find(p => p.slug === slug);
  }, [posts]);

  const getRelatedPosts = useCallback((currentId: string, destinationId: string | null, limit = 3) => {
    return posts
      .filter(p => p.id !== currentId && p.is_published && (destinationId ? p.destination_id === destinationId : true))
      .slice(0, limit);
  }, [posts]);

  return { posts, loading, fetchPosts, getPublishedPosts, getPostBySlug, getRelatedPosts };
};
