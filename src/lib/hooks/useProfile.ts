import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // The main loading state for the UI
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Internal loading state for the profile fetch
  const [profileLoading, setProfileLoading] = useState(true);

  // The analytics hook manages its own loading state
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData("all-time", new Date().getFullYear());

  const fetchProfile = useCallback(
    async (currentUser: User) => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, bio")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        toast.error("Error fetching profile", { description: error.message });
      } else if (data) {
        setProfile(data);
      }
      setProfileLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        // If there's no user, we can stop the loading process
        setProfileLoading(false);
      }
    };
    getSession();
  }, [supabase.auth, fetchProfile]);

  // This effect synchronizes the internal loading states into a single `loading` state
  // for the consuming component. The skeleton loader will remain until both are false.
  useEffect(() => {
    if (profileLoading || statsLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [profileLoading, statsLoading]);

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!user) return false;

    setSaving(true);
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
      setSaving(false);
      return false;
    }

    setProfile((prev) => ({ ...prev!, ...updatedProfile }));
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
    setProfile,
    loading,
    saving,
    updateProfile,
    uploading,
    uploadAvatar,
    stats,
    statsError,
  };
}
