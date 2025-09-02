import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";
import useSWR, { useSWRConfig } from "swr";

export type Profile = {
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
};

export type ProfileStats = {
  totalStudySessions: number;
  totalStudyTime: number;
  bestStreak: number;
};

export function useProfile() {
  const supabase = createClient();
  const { mutate } = useSWRConfig();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // SWR hook for fetching the user session
  const { data: user, error: userError } = useSWR("user-session", async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user ?? null;
  });

  // Dependent SWR hook for fetching the profile
  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
  } = useSWR(user ? ["profile", user.id] : null, async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, bio")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Error fetching profile", { description: error.message });
      throw error;
    }
    return data;
  });

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData("all-time", new Date().getFullYear());

  const loading = profileLoading || statsLoading;

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!user) return false;

    setSaving(true);

    // Optimistic UI update
    const previousProfile = profile;
    mutate(
      ["profile", user.id],
      { ...profile, ...updatedProfile },
      { revalidate: false }
    );

    const { error } = await supabase
      .from("profiles")
      .update(updatedProfile)
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        toast.error("This username is already taken.");
      } else {
        toast.error("Error updating profile", { description: error.message });
      }
      // Revert the optimistic update on error
      mutate(["profile", user.id], previousProfile, { revalidate: false });
      setSaving(false);
      return false;
    }

    // Revalidate the data to ensure it's up-to-date
    mutate(["profile", user.id]);
    toast.success("Profile saved successfully!");
    setSaving(false);
    return true;
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast.error("Authentication Error", {
        description: "You are not logged in.",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid File Type", {
        description: "Please select a JPG or PNG image.",
      });
      return;
    }

    const maxSizeInMB = 1;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error("File Too Large", {
        description: `Maximum size is ${maxSizeInMB}MB.`,
      });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    try {
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        if (oldPath.startsWith(user.id)) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        await updateProfile({ avatar_url: urlData.publicUrl });
      } else {
        throw new Error("Failed to get public URL for uploaded file");
      }
    } catch (error: any) {
      toast.error("Avatar Upload Failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return {
    user,
    profile,
    loading,
    saving,
    updateProfile,
    uploading,
    uploadAvatar,
    stats,
    statsError,
  };
}
