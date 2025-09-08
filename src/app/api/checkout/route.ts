import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dodoClient } from "@/utils/server/dodo";

export async function POST(req: Request) {
  let checkoutSession;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planType } = await req.json();

    let product_id;

    if (planType === "monthly") {
      product_id = process.env.PRO_MONTHLY_PRODUCT_ID!;
    } else if (planType === "yearly") {
      product_id = process.env.PRO_YEARLY_PRODUCT_ID!;
    } else if (planType === "lifetime") {
      product_id = process.env.PRO_LIFETIME_PRODUCT_ID!;
    } else {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    checkoutSession = await dodoClient.checkoutSessions.create({
      product_cart: [{ product_id, quantity: 1 }],
      allowed_payment_method_types: ["credit", "debit"],
      return_url: `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.BASE_URL
      }/success`,
      customer: { email: user.email!, name: user.user_metadata.name },
      metadata: { userId: user.id },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  if (checkoutSession?.checkout_url) {
    return NextResponse.json({ checkout_url: checkoutSession.checkout_url });
  }

  return NextResponse.json(
    { error: "Failed to create checkout session" },
    { status: 500 }
  );
}
