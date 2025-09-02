import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

export type Profile = {
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
};

export function useProfile() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = useCallback(
    async (currentUser: User) => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, bio")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
      } else if (data) {
        setProfile(data);
      }
      setLoading(false);
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
        setLoading(false);
      }
    };
    getSession();
  }, [supabase.auth, fetchProfile]);

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
        toast.error("Error updating profile", {
          description: error.message,
        });
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user || !user) {
      console.error("No authenticated user found");
      toast.error("Authentication Error", {
        description: "You are not logged in. Please refresh and try again.",
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
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        if (oldPath.startsWith(user.id)) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        let description = uploadError.message;
        if (uploadError.message.includes("row-level security")) {
          description =
            "You don't have permission to upload files. Please contact support.";
        } else if (uploadError.message.includes("duplicate")) {
          description = "File already exists. Please try again.";
        }
        toast.error("Error uploading avatar", { description });
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        await updateProfile({ avatar_url: urlData.publicUrl });
        // The success toast for this is handled inside `updateProfile`
      } else {
        throw new Error("Failed to get public URL for uploaded file");
      }
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      toast.error("Avatar Upload Failed", {
        description:
          error.message || "An unknown error occurred. Please try again.",
      });
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
  };
}
