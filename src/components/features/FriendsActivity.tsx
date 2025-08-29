import { Badge, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface Friend {
  name: string;
  status: string;
  avatar: string;
  streak: number;
  isOnline: boolean;
  hoursToday: number;
}

interface FriendsActivityProps {
  friends: Friend[];
}

export const FriendsActivity: React.FC<FriendsActivityProps> = ({
  friends = [
    {
      name: "Alex Johnson",
      status: "Studying Mathematics",
      avatar: "👨‍💻",
      streak: 15,
      isOnline: true,
      hoursToday: 3.5,
    },
    {
      name: "Sarah Chen",
      status: "Taking a break",
      avatar: "👩‍🎓",
      streak: 8,
      isOnline: true,
      hoursToday: 2.0,
    },
    {
      name: "Mike Davis",
      status: "Physics homework",
      avatar: "👨‍🔬",
      streak: 12,
      isOnline: false,
      hoursToday: 1.5,
    },
    {
      name: "Emma Wilson",
      status: "Reading history",
      avatar: "👩‍📚",
      streak: 20,
      isOnline: true,
      hoursToday: 4.0,
    },
  ],
}) => {
  return (
    <Card className="shadow-lg bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {/* Online indicator */}
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Friends Activity</span>
          </CardTitle>

          {/* Live badge */}
          <Badge className="bg-accent text-accent-foreground font-medium">
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {friends.slice(0, 4).map((friend, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border border-border"
          >
            {/* Avatar + online dot */}
            <div className="relative">
              <div className="text-2xl">{friend.avatar}</div>
              {friend.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border-2 border-background rounded-full"></div>
              )}
            </div>

            {/* Friend details */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{friend.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {friend.status}
              </p>
            </div>

            {/* Streak + hours */}
            <div className="text-right">
              <div className="flex items-center space-x-1 text-xs text-destructive">
                <Flame className="w-3 h-3" />
                <span className="font-medium">{friend.streak}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {friend.hoursToday}h today
              </div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <Button variant="ghost" size="sm" className="w-full">
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
};
