import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handleSubscription = async (subscriptionData: any) => {
  const { error } = await supabase.from("subscriptions").upsert({
    user_id: subscriptionData.metadata.userId,
    dodo_customer_id: subscriptionData.customer.customer_id,
    status:
      subscriptionData.status === "on_hold" ? "due" : subscriptionData.status,
    start_date: subscriptionData.previous_billing_date,
    end_date: subscriptionData.next_billing_date,
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
    amount: paymentData.settlement_amount,
    currency: paymentData.settlement_currency,
    status: "completed",
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
