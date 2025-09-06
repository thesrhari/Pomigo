import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { dodoClient } from "@/utils/server/dodo";
import {
  handlePayments,
  handleRefund,
  handleSubscription,
} from "@/utils/server/subscriptions";

const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!);

export async function POST(request: Request) {
  const headersList = await headers();

  try {
    const rawBody = await request.text();
    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };
    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody);

    if (payload.data.payload_type === "Subscription") {
      switch (payload.type) {
        case "subscription.active":
        case "subscription.cancelled":
        case "subscription.renewed":
        case "subscription.on_hold":
          const subscription = await dodoClient.subscriptions.retrieve(
            payload.data.subscription_id
          );
          await handleSubscription(subscription);
          break;
        default:
          console.log(`Unhandled event type: ${payload.type}`);
          break;
      }
    } else if (payload.data.payload_type === "Payment") {
      switch (payload.type) {
        case "payment.succeeded":
          const paymentData = await dodoClient.payments.retrieve(
            payload.data.payment_id
          );
          await handlePayments(paymentData);
        default:
          break;
      }
    } else if (payload.data.payload_type === "Refund") {
      if (payload.type === "refund.succeeded") {
        const refundData = await dodoClient.payments.retrieve(
          payload.data.payment_id
        );
        await handleRefund(refundData.metadata.userId, refundData.payment_id);
      }
    }
    return Response.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
