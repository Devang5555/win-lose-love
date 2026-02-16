
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  author TEXT NOT NULL DEFAULT 'GoBhraman Team',
  destination_id UUID REFERENCES public.destinations(id),
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view published posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts FOR SELECT
USING (is_published = true);

-- Admins and content managers can manage all posts
CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'content_manager']::app_role[]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'content_manager']::app_role[]));

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
