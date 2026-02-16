import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600",
};

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const siteUrl = "https://win-lose-love.lovable.app";

  const [{ data: trips }, { data: destinations }] = await Promise.all([
    supabase.from("trips").select("slug, trip_id, updated_at").eq("is_active", true),
    supabase.from("destinations").select("slug, created_at"),
  ]);

  const staticPages = [
    { loc: "/", priority: "1.0" },
    { loc: "/trips", priority: "0.8" },
    { loc: "/destinations", priority: "0.8" },
    { loc: "/about", priority: "0.5" },
    { loc: "/contact", priority: "0.5" },
  ];

  const tripPages = (trips || []).map((t) => ({
    loc: `/trips/${t.slug || t.trip_id}`,
    lastmod: t.updated_at?.split("T")[0],
    priority: "0.9",
  }));

  const destPages = (destinations || []).map((d) => ({
    loc: `/destinations/${d.slug}`,
    lastmod: d.created_at?.split("T")[0],
    priority: "0.7",
  }));

  const allPages = [...staticPages, ...tripPages, ...destPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${siteUrl}${p.loc}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
