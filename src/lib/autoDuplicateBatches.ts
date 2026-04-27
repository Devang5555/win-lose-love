import { supabase } from "@/integrations/supabase/client";

// Run at most once per minute per tab to avoid spamming the RPC.
let inFlight: Promise<number> | null = null;
let lastRunAt = 0;
const COOLDOWN_MS = 60_000;

export const autoDuplicateBatches = async (): Promise<number> => {
  const now = Date.now();
  if (inFlight) return inFlight;
  if (now - lastRunAt < COOLDOWN_MS) return 0;

  inFlight = (async () => {
    try {
      const { data, error } = await supabase.rpc("auto_duplicate_batches");
      if (error) {
        console.warn("auto_duplicate_batches failed:", error.message);
        return 0;
      }
      lastRunAt = Date.now();
      return (data as number) ?? 0;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};
