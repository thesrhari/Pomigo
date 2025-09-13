import React, { useState } from "react";
import { useActivityFeed } from "@/lib/hooks/useActivityFeed";
import { useProStatus } from "@/lib/hooks/useProStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  BookOpen,
  Target,
  Flame,
  Trophy,
  Activity,
  UserPlus,
  EyeOff,
  ExternalLink,
  Crown,
  HelpCircle,
} from "lucide-react";
import { useFriends } from "@/lib/hooks/useFriends";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Image from "next/image";

// Using a simple time formatting function instead of date-fns
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "yesterday";
  return `${diffInDays}d ago`;
};

const activityIcons = {
  completed_session: BookOpen,
  completed_break: Clock,
  study_summary: Target,
  first_session: Users,
  on_a_roll: Flame,
  streak_milestone: Trophy,
} as const;

const activityColors = {
  completed_session: "text-blue-500",
  completed_break: "text-green-500",
  study_summary: "text-purple-500",
  first_session: "text-orange-500",
  on_a_roll: "text-red-500",
  streak_milestone: "text-yellow-500",
};

// Define a type for the activity keys
type ActivityType = keyof typeof activityIcons;

// Define a more specific type for the activity object
interface User {
  display_name: string;
  avatar_url: string | null;
}

interface ActivityItem {
  id: string | number;
  activity_type: ActivityType;
  created_at: string;
  message: string;
  user: User;
}

function ActivityFeedItem({ activity }: { activity: ActivityItem }) {
  const Icon = activityIcons[activity.activity_type];
  const colorClass = activityColors[activity.activity_type];

  const timeAgo = formatTimeAgo(activity.created_at);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex-shrink-0">
        <Avatar className="h-10 w-10 cursor-pointer select-none">
          {activity.user.avatar_url ? (
            <Image
              src={activity.user.avatar_url}
              alt={activity.user.display_name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <AvatarFallback>
              {activity.user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium">{activity.user.display_name}</span>{" "}
              {activity.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ friendCount }: { friendCount: number }) {
  if (friendCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm font-medium">Add some friends</p>
        <p className="text-xs mt-1">
          Learning is more fun with a little peer pressure.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-sm">No recent friend activity.</p>
      <p className="text-xs mt-1">
        Your friends are quiet… probably plotting their comeback.
      </p>
    </div>
  );
}

// New component for when the user has disabled their feed
function DisabledState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-sm font-medium">Activity Feed is Disabled</p>
      <p className="text-xs mt-1">
        Enable it in your profile settings to see friend activities.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-pulse"
        >
          <div className="w-8 h-8 rounded-full bg-muted"></div>
          <div className="flex-1">
            <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// New component for the full activity modal
function ActivityModal({
  activities,
  loading,
  error,
  isDisabled,
  friendCount,
  isPro,
  isProLoading,
}: {
  activities: ActivityItem[];
  loading: boolean;
  error: boolean;
  isDisabled: boolean;
  friendCount: number;
  isPro: boolean;
  isProLoading: boolean;
}) {
  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }
    if (error) {
      return (
        <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
          Failed to load activity feed. Please try again.
        </div>
      );
    }
    if (isDisabled) {
      return <DisabledState />;
    }
    if (activities.length === 0) {
      return <EmptyState friendCount={friendCount} />;
    }
    return (
      <div className="space-y-3">
        {activities.map((activity: ActivityItem) => (
          <ActivityFeedItem key={activity.id} activity={activity} />
        ))}
      </div>
    );
  };

  return (
    <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Friend Activity</span>
        </DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">{renderContent()}</div>

      {/* --- MODIFIED UPSELL SECTION --- */}
      {!isProLoading && !isPro && !loading && !isDisabled && (
        <div className="border-t border-border pt-4 mt-4">
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center justify-between gap-2 text-xs bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="font-medium text-foreground">
                  Upgrade to Pro to see more of your friends&apos; activity
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* The user hovers over this icon */}
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="max-w-xs p-3">
                  <div className="text-left space-y-2">
                    <p>
                      <strong>Pro Plan:</strong> You get a full 7-day activity
                      history. If there are fewer than 20 activities in that
                      time, we show you the 20 most recent ones to ensure your
                      feed is never empty.
                    </p>
                    <p>
                      <strong>Free Plan:</strong> You see the 20 most recent
                      activities.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      )}
      {/* --- END OF MODIFICATION --- */}
    </DialogContent>
  );
}

export const FriendsActivity = () => {
  const { activities, loading, error, isDisabled } = useActivityFeed();
  const { friends } = useFriends();
  const { isPro, isLoading: isProLoading } = useProStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }
    if (error) {
      return (
        <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
          Failed to load activity feed. Please try again.
        </div>
      );
    }
    if (isDisabled) {
      return <DisabledState />;
    }
    if (activities.length === 0) {
      return <EmptyState friendCount={friends.length} />;
    }
    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.slice(0, 3).map((activity: ActivityItem) => (
          <ActivityFeedItem key={activity.id} activity={activity} />
        ))}
      </div>
    );
  };

  const hasActivities =
    !loading && !error && !isDisabled && activities.length > 0;

  return (
    <>
      <Card className="border-border bg-card h-fit">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <Activity className="w-5 h-5" />
            <span>Friend Activity</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {renderContent()}

          {hasActivities && (
            <div className="text-center mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">
                Showing recent friend activities
              </p>
            </div>
          )}

          {/* Show button for all states except loading */}
          {!loading && (
            <div className="mt-4">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isDisabled}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All Activity
                  </Button>
                </DialogTrigger>
                <ActivityModal
                  activities={activities}
                  loading={loading}
                  error={!!error}
                  isDisabled={isDisabled}
                  friendCount={friends.length}
                  isPro={isPro}
                  isProLoading={isProLoading}
                />
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
