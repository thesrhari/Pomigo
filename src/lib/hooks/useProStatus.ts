import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

// The Subscription interface can be kept for type safety within the fetcher.
export interface Subscription {
  user_id: string;
  subscription_id: string;
  customer_id: string;
  status: "active" | "cancelled" | "due";
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface UseProStatusReturn {
  isPro: boolean;
  isLoading: boolean;
}

const fetcher = async (
  key: string,
  userId: string
): Promise<Subscription | null> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no subscription is found, return null instead of throwing an error.
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
};

export const useProStatus = (user: User | null): UseProStatusReturn => {
  const { data: subscription, isLoading } = useSWR(
    user ? ["subscription", user.id] : null,
    ([, userId]) => fetcher("subscription", userId)
  );

  const isPro =
    !!subscription &&
    subscription.status === "active" &&
    new Date(subscription.end_date) > new Date();

  return { isPro, isLoading };
};
