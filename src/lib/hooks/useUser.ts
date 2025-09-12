// lib/hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../supabase/client";

const supabase = createClient();

const fetchUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
};

export function useUser() {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
  });

  return {
    user,
    userId: user?.id,
    isLoading,
    error,
  };
}
