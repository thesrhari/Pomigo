import { createClient } from "@/lib/supabase/server"; // <-- Use the new server client
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  // Create a Supabase client that can read the user's session from the cookies
  const supabase = await createClient();

  try {
    // Check if there is a user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // The user from the body is who the client WANTS to delete
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Authorization check:
    // 1. Is there an authenticated user? (authError or !user)
    // 2. Is the authenticated user trying to delete THEMSELVES? (user.id !== userId)
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If the user is authorized, create an admin client to perform the deletion
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // This must be kept secret
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Perform the deletion
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error("Supabase admin error deleting user:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to delete user account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account successfully deleted.",
    });
  } catch (error) {
    console.error("Unexpected error in delete-account route:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
