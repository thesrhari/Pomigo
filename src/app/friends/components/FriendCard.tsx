"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  UserX,
  Shield,
  MoreHorizontal,
  Check,
  X,
  Clock,
  ShieldOff,
  Loader2, // Import a loader icon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- (User type and FriendCardProps interface remain the same) ---
type User = {
  id: string;
  name: string;
  username: string;
  avatar_url?: string | null;
  relationship_id: string;
};

interface FriendCardProps {
  user: User;
  type: "friend" | "incoming" | "outgoing" | "blocked";
  onAccept?: (relationshipId: string) => Promise<void> | void;
  onReject?: (relationshipId: string) => Promise<void> | void;
  onCancel?: (relationshipId: string) => Promise<void> | void;
  onRemove?: (relationshipId: string) => Promise<void> | void;
  onBlock?: (userId: string) => Promise<void> | void;
  onUnblock?: (relationshipId: string) => Promise<void> | void;
}

export default function FriendCard({
  user,
  type,
  onAccept,
  onReject,
  onCancel,
  onRemove,
  onBlock,
  onUnblock,
}: FriendCardProps) {
  // State to track the currently loading action
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Generic handler to manage loading state for any action
  const handleAction = async (
    actionName: string,
    actionFn: (() => Promise<void> | void) | undefined
  ) => {
    if (!actionFn || loadingAction) return; // Prevent new action while one is running

    setLoadingAction(actionName);
    try {
      await actionFn();
    } catch (error) {
      console.error(`Error during action ${actionName}:`, error);
      // Optionally, show an error toast here
    } finally {
      setLoadingAction(null); // Reset loading state
    }
  };

  const renderActions = () => {
    switch (type) {
      case "friend":
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="border-border">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    handleAction("remove", () =>
                      onRemove?.(user.relationship_id)
                    )
                  }
                  disabled={!!loadingAction}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Remove Friend
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleAction("block", () => onBlock?.(user.id))
                  }
                  disabled={!!loadingAction}
                  className="text-destructive focus:text-destructive"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      case "incoming":
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() =>
                handleAction("accept", () => onAccept?.(user.relationship_id))
              }
              disabled={!!loadingAction}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loadingAction === "accept" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction("reject", () => onReject?.(user.relationship_id))
              }
              disabled={!!loadingAction}
              className="border-border"
            >
              {loadingAction === "reject" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        );
      case "outgoing":
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-border">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction("cancel", () => onCancel?.(user.relationship_id))
              }
              disabled={!!loadingAction}
              className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {loadingAction === "cancel" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          </div>
        );
      case "blocked":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleAction("unblock", () => onUnblock?.(user.relationship_id))
            }
            disabled={!!loadingAction}
            className="border-border"
          >
            {loadingAction === "unblock" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShieldOff className="w-4 h-4 mr-2" />
            )}
            Unblock
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-medium">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          {renderActions()}
        </div>
      </CardContent>
    </Card>
  );
}
