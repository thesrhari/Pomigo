// lib/hooks/useSubscriptionManagement.ts
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { toast } from "react-toastify";

export interface SubscriptionDetails {
  user_id: string;
  customer_id: string;
  subscription_id: string | null;
  payment_frequency_interval: "Month" | "Year" | null;
  status: "active" | "cancelled" | "due";
  start_date: string;
  end_date: string | null;
  cancel_at_next_billing_date: boolean;
  amount: number | null;
  currency: string | null;
  card_last_four: string | null;
  card_network: string | null;
}

export interface Invoice {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const INVOICES_PER_PAGE = 3;

// --- Fetcher Functions for useQuery ---

/**
 * Fetches detailed subscription info for a given user.
 * It combines data from 'subscriptions' and 'payments' tables.
 */
const fetchSubscriptionDetails = async (
  userId: string
): Promise<SubscriptionDetails | null> => {
  const supabase = createClient();
  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Throw any error other than "no rows found"
  if (subError && subError.code !== "PGRST116") throw subError;
  if (!subData) return null;

  // If a subscription is cancelled and its end date has passed,
  // the user is effectively on the Free plan.
  const isEffectivelyFree =
    subData.status === "cancelled" &&
    subData.end_date &&
    new Date(subData.end_date) <= new Date();

  if (isEffectivelyFree) return null;

  // For active or grace-period subscriptions, get the latest payment details.
  const { data: paymentData } = await supabase
    .from("payments")
    .select("amount, currency, card_last_four, card_network")
    .eq("subscription_id", subData.subscription_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    ...subData,
    amount: paymentData?.amount || null,
    currency: paymentData?.currency || null,
    card_last_four: paymentData?.card_last_four || null,
    card_network: paymentData?.card_network || null,
  };
};

/**
 * Fetches a paginated list of invoices from the API.
 */
const fetchInvoices = async (
  page: number
): Promise<{ invoices: Invoice[]; hasNextPage: boolean }> => {
  const response = await fetch(
    `/api/invoices?page=${page}&limit=${INVOICES_PER_PAGE}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch invoices");
  }
  return response.json();
};

// --- Mutation Functions for useMutation ---

const cancelApiCall = async (subscriptionId: string) => {
  const response = await fetch("/api/cancel-subscription", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId }),
  });
  if (!response.ok) {
    // TanStack Query's `useMutation` will catch this error.
    throw new Error("Server failed to cancel the subscription.");
  }
};

const reactivateApiCall = async (subscriptionId: string) => {
  const response = await fetch("/api/reactivate-subscription", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId }),
  });
  if (!response.ok) {
    throw new Error("Server failed to reactivate the subscription.");
  }
};

// --- The Main Hook ---

export const useSubscriptionManagement = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // --- Data Fetching using useQuery ---

  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ["subscriptionDetails", user?.id],
    queryFn: () => fetchSubscriptionDetails(user!.id),
    enabled: !!user, // The query will not run until the user is loaded.
  });

  const { data: invoiceData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices", user?.id, currentPage],
    queryFn: () => fetchInvoices(currentPage),
    enabled: !!user,
    placeholderData: (previousData) => previousData, // Keeps old data visible while fetching new page.
  });

  // --- Data Mutations using useMutation ---

  const { mutateAsync: cancelSubscription, isPending: isCancelling } =
    useMutation({
      mutationFn: () => {
        if (!subscription?.subscription_id) {
          throw new Error("No active subscription to cancel.");
        }
        return cancelApiCall(subscription.subscription_id);
      },
      // --- MODIFIED START ---
      onSuccess: () => {
        toast.info("Subscription scheduled for cancellation.");
        // Manually update the local cache to reflect the change instantly.
        queryClient.setQueryData(
          ["subscriptionDetails", user?.id],
          (oldData: SubscriptionDetails | null | undefined) => {
            if (!oldData) return null;
            return {
              ...oldData,
              cancel_at_next_billing_date: true, // This is the expected change
            };
          }
        );
      },
      // --- MODIFIED END ---
      onError: (error) => toast.error(error.message),
    });

  const { mutateAsync: reactivateSubscription, isPending: isReactivating } =
    useMutation({
      mutationFn: () => {
        if (!subscription?.subscription_id) {
          throw new Error("No subscription to reactivate.");
        }
        return reactivateApiCall(subscription.subscription_id);
      },
      // --- MODIFIED START ---
      onSuccess: () => {
        toast.success("Subscription reactivated successfully.");
        // Manually update the local cache to reflect the change instantly.
        queryClient.setQueryData(
          ["subscriptionDetails", user?.id],
          (oldData: SubscriptionDetails | null | undefined) => {
            if (!oldData) return null;
            return {
              ...oldData,
              cancel_at_next_billing_date: false, // This is the expected change
            };
          }
        );
      },
      // --- MODIFIED END ---
      onError: (error) => toast.error(error.message),
    });

  const downloadInvoice = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/invoice/${transactionId}`);
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  // --- Derived State (calculated from query data) ---

  const isActive = subscription?.status === "active";
  const isCancelled = subscription?.status === "cancelled";
  const isLifetime = !!(subscription && !subscription.subscription_id);
  const hasAccess =
    isActive ||
    !!(
      isCancelled &&
      subscription.end_date &&
      new Date(subscription.end_date) > new Date()
    );

  const getPlanName = () => {
    if (!subscription) return "Free";
    if (isLifetime) return "Pro Lifetime";
    if (subscription.payment_frequency_interval === "Month" && hasAccess)
      return "Pro Monthly";
    if (subscription.payment_frequency_interval === "Year" && hasAccess)
      return "Pro Yearly";
    return "Free";
  };

  return {
    subscription,
    invoices: invoiceData?.invoices || [],
    loading: isSubscriptionLoading,
    invoicesLoading: isInvoicesLoading,
    cancelling: isCancelling,
    reactivating: isReactivating,
    isLifetime,
    isActive,
    isCancelled,
    hasAccess,
    getPlanName,
    cancelSubscription,
    reactivateSubscription,
    downloadInvoice,
    currentPage,
    hasNextPage: invoiceData?.hasNextPage || false,
    handlePageChange: setCurrentPage,
  };
};
