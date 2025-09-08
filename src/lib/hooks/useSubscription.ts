import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  error: any;
  isPro: boolean;
  isActive: boolean;
  mutate: () => void;
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
    // If no subscription found, return null (not an error)
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
};

export const useSubscription = (user: User | null): UseSubscriptionReturn => {
  const {
    data: subscription,
    error,
    isLoading,
    mutate,
  } = useSWR(
    user ? ["subscription", user.id] : null,
    ([, userId]) => fetcher("subscription", userId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  const isPro = subscription !== null && subscription !== undefined;
  const isActive = subscription?.status === "active";

  return {
    subscription: subscription ?? null,
    isLoading,
    error,
    isPro,
    isActive,
    mutate,
  };
};
