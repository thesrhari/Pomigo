// lib/hooks/useProStatus.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";

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

const fetchSubscription = async (
  userId: string
): Promise<Subscription | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no row is found, Supabase returns an error.
    // We'll treat this as "no active subscription" and return null.
    if (error.code === "PGRST116") {
      return null;
    }
    // For other errors, we should throw to let React Query handle it.
    throw new Error(error.message);
  }

  return data;
};

export const useProStatus = (): UseProStatusReturn => {
  const { user } = useUser();

  const { data: subscription, isLoading } = useQuery({
    // The query key is an array that uniquely identifies this query.
    // Including the user's ID ensures the data is refetched if the user changes.
    queryKey: ["subscription", user?.id],
    // The query function to fetch the data.
    queryFn: () => fetchSubscription(user!.id),
    // The query will only execute if a user is logged in.
    enabled: !!user,
  });

  const isPro =
    !!subscription &&
    subscription.status === "active" &&
    new Date(subscription.end_date) > new Date();

  return { isPro, isLoading };
};
