// Extract itinerary days/items from an uploaded image (PDF page, screenshot, brochure)
// using Lovable AI Gateway (google/gemini-2.5-flash). Returns structured JSON.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface ItineraryDay {
  day: number;
  title: string;
  icon?: string;
  stay?: string;
  items: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const imageDataUrl: string | undefined = body?.image;
    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
      return new Response(JSON.stringify({ error: 'image (data URL) required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You extract structured trip itineraries from images (brochures, PDFs, screenshots).
Return ONLY valid JSON with this exact shape (no prose, no markdown fences):
{
  "bestTime": "string or empty",
  "itinerary": [
    { "day": 1, "title": "Day title with route", "icon": "Sun", "stay": "optional stay note", "items": ["activity 1", "activity 2"] }
  ]
}
Rules:
- Number days starting at 1.
- Include km/hrs in titles when present.
- Allowed icons: Sun, Mountain, Tent, Plane, Car, MapPin, Camera, Utensils, Sparkles.
- Each item: short bullet (under 120 chars).
- If unclear, return empty itinerary array.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the itinerary from this image.' },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[OCR] Gateway error', resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit — try again in a minute.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Top up Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI gateway failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
    let parsed: { bestTime?: string; itinerary?: ItineraryDay[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('[OCR] JSON parse failed', cleaned.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Model returned non-JSON', raw: cleaned.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[OCR] Unhandled', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
