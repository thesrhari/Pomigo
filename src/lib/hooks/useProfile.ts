"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";
import { useUser } from "./useUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Profile = {
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  activity_feed_enabled: boolean;
};

export type ProfileStats = {
  totalStudySessions: number;
  totalStudyTime: number;
  bestStreak: number;
};

export function useProfile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user, userId, isLoading: isUserLoading } = useUser();

  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading: isProfileLoading } =
    useQuery<Profile | null>({
      queryKey: ["profile", userId],
      queryFn: async () => {
        if (!userId) return null;
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "username, display_name, avatar_url, bio, activity_feed_enabled"
          )
          .eq("id", userId)
          .single();

        if (error) {
          toast.error("Error fetching profile. Please try again.");
          throw error;
        }
        return data;
      },
      enabled: !!userId,
    });

  const { mutate: updateProfile, isPending: isSaving } = useMutation({
    mutationFn: async (updatedProfile: Partial<Profile>) => {
      if (!userId) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", userId);

      if (error) throw error;
      // Pass the updated profile data to onSuccess
      return updatedProfile;
    },
    onSuccess: (updatedProfile) => {
      // Update the local cache with the new data
      queryClient.setQueryData(
        ["profile", userId],
        (old: Profile | undefined) =>
          old ? { ...old, ...updatedProfile } : undefined
      );
      toast.success("Profile saved successfully!");
    },
    onError: (err: any) => {
      if (err.code === "23505") {
        toast.error("This username is already taken.");
      } else {
        toast.error("Error updating profile. Please try again later.");
      }
    },
  });

  const { mutate: updateActivityFeedSetting } = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!userId) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ activity_feed_enabled: enabled })
        .eq("id", userId);
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      // Update the local cache with the new setting
      queryClient.setQueryData(
        ["profile", userId],
        (old: Profile | undefined) =>
          old ? { ...old, activity_feed_enabled: enabled } : undefined
      );
      toast.success(
        enabled
          ? "Activity feed enabled. Your friends can now see your study activity!"
          : "Activity feed disabled. Your study activity is now private."
      );
    },
    onError: () => {
      toast.error(
        "Failed to update activity feed setting. Please try again later."
      );
    },
  });

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData({ type: "all-time" }, new Date().getFullYear());

  const loading = isUserLoading || isProfileLoading || statsLoading;

  const uploadAvatar = async (file: File) => {
    if (!userId) {
      toast.error("Authentication Error. You are not logged in.");
      return;
    }
    // ... file validation logic ...
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    try {
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        if (oldPath.startsWith(userId)) {
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
        updateProfile({ avatar_url: urlData.publicUrl });
        toast.success("Avatar updated successfully!");
      } else {
        throw new Error("Failed to get public URL for uploaded file");
      }
    } catch {
      toast.error("Avatar Upload Failed. Please try again later.");
    } finally {
      setUploading(false);
    }
  };

  return {
    user,
    profile,
    loading,
    saving: isSaving,
    updateProfile,
    updateActivityFeedSetting,
    uploading,
    uploadAvatar,
    stats,
    statsError,
  };
}
