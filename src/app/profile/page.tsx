"use client";

import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Loader2 } from "lucide-react";
import AvatarCropper from "@/components/AvatarCropper";
import { ProfilePageSkeleton } from "./components/ProfilePageSkeleton";

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes) / 60;
  return `${hours.toFixed(1)}h`;
};

export default function ProfilePage() {
  const {
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
  } = useProfile();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    if (!profile) return;
    await updateProfile({
      display_name: profile.display_name,
      username: profile.username,
      bio: profile.bio,
    });
  };

  const getAvatarFallback = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  if (loading) {
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
                    accept="image/png, image/jpeg"
                    onChange={handleFileSelect}
                  />
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {uploading ? "Uploading..." : "Change Avatar"}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG or PNG. Max size of 1MB.
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={handleInputChange}
                    />
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
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t px-6 py-4">
                <Button
                  onClick={handleSaveChanges}
                  disabled={saving || uploading}
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
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  This action is permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">
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
