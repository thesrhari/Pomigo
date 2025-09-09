// app/api/cancel-subscription/route.ts
import { createClient } from "@/lib/supabase/server";
import { dodoClient } from "@/utils/server/dodo";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("subscription_id")
      .eq("user_id", user.id)
      .eq("subscription_id", subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    try {
      await dodoClient.subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: true,
      });
    } catch (error) {
      console.error("Dodo API error:", error);
      return NextResponse.json(
        { error: "Failed to cancel subscription with payment provider" },
        { status: 500 }
      );
    }

    // Update the subscription in our database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_next_billing_date: true,
        updated_at: new Date().toISOString(),
      })
      .eq("subscription_id", subscriptionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update subscription status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
