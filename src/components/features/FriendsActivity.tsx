import React from "react";
import { useActivityFeed } from "@/lib/hooks/useActivityFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Clock,
  BookOpen,
  Target,
  Flame,
  Trophy,
  Activity,
  UserPlus,
  EyeOff, // Import new icon
} from "lucide-react";
import { useFriends } from "@/lib/hooks/useFriends";

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
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
          {activity.user.avatar_url &&
          activity.user.avatar_url.startsWith("http") ? (
            <img
              src={activity.user.avatar_url}
              alt={activity.user.display_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span>{activity.user.avatar_url || "👤"}</span>
          )}
        </div>
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

export const FriendsActivity = () => {
  const { activities, loading, error, isDisabled } = useActivityFeed();
  const { friends } = useFriends();

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
        {activities.map((activity: ActivityItem) => (
          <ActivityFeedItem key={activity.id} activity={activity} />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border bg-card h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2 text-card-foreground">
          <Activity className="w-5 h-5" />
          <span>Friend Activity</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {renderContent()}

        {!loading && !isDisabled && activities.length > 0 && (
          <div className="text-center mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing recent friend activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
