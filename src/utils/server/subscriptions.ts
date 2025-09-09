import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handleSubscription = async (subscriptionData: any) => {
  const { error } = await supabase.from("subscriptions").upsert({
    user_id: subscriptionData.metadata.userId,
    customer_id: subscriptionData.customer.customer_id,
    subscription_id: subscriptionData.subscription_id,
    payment_frequency_interval: subscriptionData.payment_frequency_interval,
    status:
      subscriptionData.status === "on_hold" ? "due" : subscriptionData.status,
    start_date: subscriptionData.previous_billing_date,
    end_date: subscriptionData.next_billing_date,
    cancel_at_next_billing_date: subscriptionData.cancel_at_next_billing_date,
  });

  if (error) {
    console.error("Error updating subscription to active:", error);
    throw error;
  }
};

export const handleLifetimeAccess = async (paymentData: any) => {
  const { error } = await supabase.from("subscriptions").upsert({
    user_id: paymentData.metadata.userId,
    customer_id: paymentData.customer.customer_id,
    subscription_id: paymentData.subscription_id,
    payment_frequency_interval: null,
    status: "active",
    start_date: paymentData.created_at,
    end_date: null,
    cancel_at_next_billing_date: null,
  });

  if (error) {
    console.error("Error updating subscription to active:", error);
    throw error;
  }
};

export const handlePayments = async (paymentData: any) => {
  const { error } = await supabase.from("payments").upsert({
    user_id: paymentData.metadata.userId,
    transaction_id: paymentData.payment_id,
    subscription_id: paymentData.subscription_id,
    amount: paymentData.settlement_amount - paymentData.settlement_tax,
    currency: paymentData.settlement_currency,
    status: "completed",
    card_last_four: paymentData.card_last_four,
    card_network: paymentData.card_network,
  });

  if (error) {
    console.error("Error updating subscription to active:", error);
    throw error;
  }
};

export const handleRefund = async (userId: string, transactionId: string) => {
  const { error } = await supabase.rpc("handle_refund", {
    uid: userId,
    tid: transactionId,
  });

  if (error) {
    console.error("Error handling refund:", error);
    throw error;
  }
};
