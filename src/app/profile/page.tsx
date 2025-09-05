"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import AvatarCropper from "@/components/AvatarCropper";
import { ProfilePageSkeleton } from "./components/ProfilePageSkeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { Switch } from "@/components/ui/switch";

const formatDuration = (minutes: number) => {
  if (typeof minutes !== "number" || isNaN(minutes)) {
    return "0.0h";
  }
  const hours = Math.floor(minutes) / 60;
  return `${hours.toFixed(1)}h`;
};

export default function ProfilePage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const {
    user,
    profile,
    setProfile,
    loading,
    saving,
    updateProfile,
    updateActivityFeedSetting,
    uploading,
    uploadAvatar,
    stats,
    statsError,
  } = useProfile();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);

  // Validation states
  const [displayNameError, setDisplayNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Account deletion states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmationUsername, setConfirmationUsername] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 10 * 1024; // 1MB

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Please select a JPG, PNG, or WEBP image."
        );
        return;
      }

      if (file.size > maxSize) {
        toast.error("File size exceeds the 1MB limit.");
        return;
      }

      setSelectedImage(file);
      setEditorOpen(true);
      e.target.value = "";
    }
  };

  const handleSaveCroppedImage = async (croppedFile: File) => {
    await uploadAvatar(croppedFile);
    setEditorOpen(false);
    setSelectedImage(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (profile) {
      if (id === "username") {
        const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
        setProfile({ ...profile, [id]: sanitizedValue });
      } else {
        setProfile({ ...profile, [id]: value });
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!profile || !user) return;

    // Reset previous errors
    setDisplayNameError("");
    setUsernameError("");

    // --- Validation Logic ---
    let isValid = true;
    if (profile.display_name.trim().length < 3) {
      setDisplayNameError("Display name must be at least 3 characters.");
      isValid = false;
    }
    if (profile.username.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      isValid = false;
    }

    if (!isValid) {
      return; // Stop if validation fails
    }

    try {
      // Check if username is taken, but only if it has been changed
      const { data: originalProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (originalProfile && originalProfile.username !== profile.username) {
        const { data: existingUser, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", profile.username)
          .single();

        if (existingUser) {
          setUsernameError("This username is already taken.");
          toast.error("Username is taken. Please choose a different username.");
          return;
        }
      }

      // If all checks pass, proceed with the update
      await updateProfile({
        display_name: profile.display_name.trim(),
        username: profile.username.trim(),
        bio: profile.bio.trim(),
      });
    } catch (error) {
      toast.error("Failed to update profile.");
      console.error("Error updating profile:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !profile) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }

      toast.success("Your account has been successfully deleted.");
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(`Failed to delete account: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setConfirmationUsername("");
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
    setConfirmationUsername("");
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setConfirmationUsername("");
  };

  if (!isClient || loading) {
    return <ProfilePageSkeleton />;
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto max-w-6xl p-8 text-center">
        <h2 className="text-2xl font-semibold">Could not load profile.</h2>
        <p className="mt-2 text-muted-foreground">
          Please try logging in again.
        </p>
      </div>
    );
  }

  const isDeleteConfirmationValid =
    confirmationUsername === profile?.username &&
    confirmationUsername.length > 0;

  const getAvatarFallback = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  const journeyStats = stats
    ? [
        {
          label: "Total sessions",
          value: stats.totalStudySessions.toLocaleString(),
        },
        {
          label: "Total hours",
          value: formatDuration(stats.totalStudyTime),
        },
        { label: "Best streak", value: `${stats.bestStreak} days` },
      ]
    : [];

  return (
    <>
      <AvatarCropper
        isOpen={isEditorOpen}
        onClose={() => setEditorOpen(false)}
        image={selectedImage}
        onSave={handleSaveCroppedImage}
      />

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-2 flex flex-col">
              <span className="mt-2">
                This action will permanently delete your account and all
                associated data. This cannot be undone.
              </span>
              <span>
                To confirm, please type your username{" "}
                <span className="font-semibold">{profile.username}</span> below:
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirmation-username">Username</Label>
            <Input
              id="confirmation-username"
              value={confirmationUsername}
              onChange={(e) => setConfirmationUsername(e.target.value)}
              placeholder={profile.username}
              className={
                confirmationUsername.length > 0 && !isDeleteConfirmationValid
                  ? "border-destructive"
                  : ""
              }
            />
            {confirmationUsername.length > 0 && !isDeleteConfirmationValid && (
              <p className="text-sm text-destructive">
                Username does not match
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!isDeleteConfirmationValid || isDeleting}
              className="cursor-pointer"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Profile & Settings
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Manage your account and personal information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details. This information will be
                  displayed publicly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url} alt="User Avatar" />
                    <AvatarFallback className="text-3xl">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    style={{ display: "none" }}
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileSelect}
                  />
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploading}
                      className="cursor-pointer"
                    >
                      {uploading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {uploading ? "Uploading..." : "Change Avatar"}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, or WEBP. Max 1MB.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name}
                      onChange={handleInputChange}
                      className={displayNameError ? "border-destructive" : ""}
                    />
                    {displayNameError && (
                      <p className="text-sm text-destructive pt-1">
                        {displayNameError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={handleInputChange}
                      className={usernameError ? "border-destructive" : ""}
                    />
                    {usernameError && (
                      <p className="text-sm text-destructive pt-1">
                        {usernameError}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell your study buddies about yourself..."
                    value={profile.bio || ""}
                    onChange={handleInputChange}
                    className="min-h-[120px] placeholder:text-muted-foreground/60"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t px-6 py-4">
                <Button
                  onClick={handleSaveChanges}
                  disabled={saving || uploading}
                  className="cursor-pointer"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  You are currently on the{" "}
                  <span className="font-semibold text-primary">Free Plan</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" disabled={true}>
                  Upgrade to Pro (Coming Soon)
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Your Journey</CardTitle>
                <CardDescription>A quick look at your stats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsError || !stats ? (
                  <p className="text-sm text-destructive">
                    Could not load stats.
                  </p>
                ) : (
                  journeyStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <p className="text-muted-foreground">{stat.label}</p>
                      <p className="font-medium text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Activity Feed Setting Card */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Control how your profile and activity are seen by others.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="activity-feed-toggle"
                      className="text-base font-medium"
                    >
                      Activity Feed
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow friends to see your study sessions in their feed.
                    </p>
                  </div>
                  <Switch
                    id="activity-feed-toggle"
                    className="cursor-pointer"
                    checked={profile.activity_feed_enabled}
                    onCheckedChange={updateActivityFeedSetting}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  This action is permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full cursor-pointer"
                  onClick={openDeleteDialog}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
