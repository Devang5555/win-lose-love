import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Experience {
  id: string;
  experience_id: string;
  name: string;
  summary: string | null;
  description: string | null;
  location: string;
  duration: string;
  time_info: string | null;
  price: number;
  category: string;
  images: string[];
  inclusions: string[];
  exclusions: string[];
  safety_info: string[];
  tags: string[];
  highlights: string[];
  is_active: boolean;
  booking_live: boolean;
  capacity: number;
  contact_phone: string | null;
  contact_email: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperienceSlot {
  id: string;
  experience_id: string;
  slot_date: string;
  start_time: string | null;
  end_time: string | null;
  seat_limit: number;
  seats_booked: number;
  available_seats: number | null;
  price_override: number | null;
  status: string;
}

export const useExperiences = () => {
  const { data: experiences = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Experience[];
    },
    staleTime: 0,
  });

  const getActiveExperiences = () => experiences.filter((e) => e.is_active);
  const getBookableExperiences = () => experiences.filter((e) => e.is_active && e.booking_live);

  return { experiences, loading, refetch, getActiveExperiences, getBookableExperiences };
};

export const useExperienceSlots = (experienceId: string | undefined) => {
  const { data: slots = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["experience-slots", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("experience_slots")
        .select("*")
        .eq("experience_id", experienceId)
        .order("slot_date", { ascending: true });
      if (error) throw error;
      return (data || []) as ExperienceSlot[];
    },
    enabled: !!experienceId,
    staleTime: 0,
  });

  const upcomingSlots = slots.filter((s) => s.status === "upcoming" && new Date(s.slot_date) >= new Date(new Date().toDateString()));

  return { slots, upcomingSlots, loading, refetch };
};
