import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const handleGoogleAuth = async () => {
    "use server";
    const supabase = await createClient();
    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/api/auth/callback?next=/dashboard",
      },
    });
    return redirect(data.url!);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-8 sm:p-12 shadow-xl text-center">
        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground">Welcome 👋</h1>
        <p className="mt-3 text-lg sm:text-xl text-muted-foreground">
          Sign in or create an account to get started
        </p>

        <Button
          variant="outline"
          onClick={handleGoogleAuth}
          className="mt-10 w-full flex items-center justify-center space-x-4 py-6 sm:py-7 text-lg sm:text-xl rounded-xl border border-border hover:bg-accent hover:shadow-md transition-all"
        >
          <FcGoogle className="!w-6 !h-6 sm:!w-7 sm:!h-7" />
          <span className="font-medium text-foreground hover:cursor-pointer">
            Continue with Google
          </span>
        </Button>
      </div>
    </div>
  );
}
