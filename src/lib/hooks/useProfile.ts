"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
  // Local state for the editable profile data
  const [profile, setProfile] = useState<Profile | null>(null);

  // SWR hook for fetching the user session
  const { data: user } = useSWR("user-session", async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user ?? null;
  });

  // SWR hook for fetching the profile data.
  // The fetched data is named `fetchedProfile` to distinguish it from the local state.
  const { data: fetchedProfile, isLoading: profileLoading } = useSWR(
    user ? ["profile", user.id] : null,
    async () => {
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
    }
  );

  // useEffect to update the local state when the fetched data is available.
  useEffect(() => {
    if (fetchedProfile) {
      setProfile(fetchedProfile);
    }
  }, [fetchedProfile]);

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData("all-time", new Date().getFullYear());

  // The overall loading state depends on fetching the initial profile and stats.
  const loading = profileLoading || statsLoading;

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!user || !profile) return false;

    setSaving(true);
    const previousProfile = profile;

    // Optimistic UI update on the local state
    setProfile({ ...profile, ...updatedProfile });

    const { error } = await supabase
      .from("profiles")
      .update(updatedProfile)
      .eq("id", user.id);

    if (error) {
      // Revert the optimistic update on error
      setProfile(previousProfile);
      if (error.code === "23505") {
        toast.error("This username is already taken.");
      } else {
        toast.error("Error updating profile", { description: error.message });
      }
      setSaving(false);
      return false;
    }

    // Revalidate the SWR data to ensure it's fresh from the server
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
    // ... file validation logic ...
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    try {
      // Delete old avatar if it exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        if (oldPath.startsWith(user.id)) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      // Update the profile with the new URL
      if (urlData?.publicUrl) {
        await updateProfile({ avatar_url: urlData.publicUrl });
        toast.success("Avatar updated successfully!");
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
    profile, // Now the state variable
    setProfile, // Now the state setter
    loading,
    saving,
    updateProfile,
    uploading,
    uploadAvatar,
    stats,
    statsError,
  };
}
