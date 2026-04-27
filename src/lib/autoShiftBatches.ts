import { supabase } from "@/integrations/supabase/client";

// Run at most once per browser session to avoid spamming the RPC.
let inFlight: Promise<number> | null = null;
let lastRunAt = 0;
const COOLDOWN_MS = 60_000; // once per minute per tab

export const autoShiftEmptyBatches = async (): Promise<number> => {
  const now = Date.now();
  if (inFlight) return inFlight;
  if (now - lastRunAt < COOLDOWN_MS) return 0;

  inFlight = (async () => {
    try {
      const { data, error } = await supabase.rpc("auto_shift_empty_batches");
      if (error) {
        console.warn("auto_shift_empty_batches failed:", error.message);
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
