// lib/hooks/useSubscriptionManagement.ts
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
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

export const useSubscriptionManagement = (user: User | null) => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const supabase = createClient();

  const fetchSubscriptionDetails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        throw subscriptionError;
      }

      if (subscriptionData) {
        // If a subscription is cancelled and its access period has ended,
        // treat the user as being on the Free plan by setting subscription to null.
        const isEffectivelyFree =
          subscriptionData.status === "cancelled" &&
          subscriptionData.end_date &&
          new Date(subscriptionData.end_date) <= new Date();

        if (isEffectivelyFree) {
          setSubscription(null);
        } else {
          // For all other cases, fetch the latest payment details.
          const { data: paymentData, error: paymentError } = await supabase
            .from("payments")
            .select("amount, currency, card_last_four, card_network")
            .eq("subscription_id", subscriptionData.subscription_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (paymentError && paymentError.code !== "PGRST116") {
            throw paymentError;
          }

          setSubscription({
            ...subscriptionData,
            amount: paymentData?.amount || null,
            currency: paymentData?.currency || null,
            card_last_four: paymentData?.card_last_four || null,
            card_network: paymentData?.card_network || null,
          });
        }
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const fetchInvoices = useCallback(
    async (page: number) => {
      if (!user) return;
      setInvoicesLoading(true);
      try {
        const response = await fetch(
          `/api/invoices?page=${page}&limit=${INVOICES_PER_PAGE}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }
        const { invoices: fetchedInvoices, hasNextPage: newHasNextPage } =
          await response.json();
        setInvoices(fetchedInvoices || []);
        setHasNextPage(newHasNextPage);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast.error("Failed to load invoices");
      } finally {
        setInvoicesLoading(false);
      }
    },
    [user]
  );

  const cancelSubscription = async () => {
    if (!subscription?.subscription_id) return;
    setCancelling(true);
    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.subscription_id }),
      });
      if (!response.ok) throw new Error("Failed to cancel subscription");
      toast.info("Subscription scheduled for cancellation");
      await fetchSubscriptionDetails();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const reactivateSubscription = async () => {
    if (!subscription?.subscription_id) return;
    setReactivating(true);
    try {
      const response = await fetch("/api/reactivate-subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.subscription_id }),
      });
      if (!response.ok) throw new Error("Failed to reactivate subscription");
      toast.success("Subscription reactivated successfully");
      await fetchSubscriptionDetails();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast.error("Failed to reactivate subscription");
    } finally {
      setReactivating(false);
    }
  };

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

  useEffect(() => {
    if (user) {
      fetchSubscriptionDetails();
    }
  }, [user, fetchSubscriptionDetails]);

  useEffect(() => {
    if (user) {
      fetchInvoices(currentPage);
    }
  }, [user, currentPage, fetchInvoices]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0) {
      setCurrentPage(newPage);
    }
  };

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
    invoices,
    loading,
    invoicesLoading,
    cancelling,
    reactivating,
    isLifetime,
    isActive,
    isCancelled,
    hasAccess,
    getPlanName,
    cancelSubscription,
    reactivateSubscription,
    downloadInvoice,
    refreshData: fetchSubscriptionDetails,
    currentPage,
    hasNextPage,
    handlePageChange,
  };
};
