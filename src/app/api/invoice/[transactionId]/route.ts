// app/api/invoice/[transactionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { dodoClient } from "@/utils/server/dodo";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
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

    // Verify the payment belongs to the user
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("transaction_id")
      .eq("user_id", user.id)
      .eq("transaction_id", transactionId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const dodoInvoiceResponse = await dodoClient.invoices.payments.retrieve(
      transactionId
    );

    if (!dodoInvoiceResponse.ok) {
      console.error("Failed to fetch invoice from Dodo API");
      return NextResponse.json(
        { error: "Failed to download invoice" },
        { status: 500 }
      );
    }

    // Get the PDF as a buffer
    const pdfBuffer = await dodoInvoiceResponse.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${transactionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Download invoice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
