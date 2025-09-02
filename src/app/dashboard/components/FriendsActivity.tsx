import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export const FriendsActivity = () => (
  <Card className="border-border bg-card h-fit">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2 text-card-foreground">
        <Activity className="w-5 h-5" />
        <span>Friend Activity</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">
        Friend activity feed coming soon!
      </p>
    </CardContent>
  </Card>
);
