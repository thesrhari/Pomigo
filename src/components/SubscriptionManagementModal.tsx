"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, CreditCard, User } from "lucide-react";
import { Subscription } from "@/lib/hooks/useProStatus";
import { toast } from "react-toastify";

interface SubscriptionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export const SubscriptionManagementModal: React.FC<
  SubscriptionManagementModalProps
> = ({ isOpen, onClose, subscription }) => {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!subscription) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-primary/20 bg-primary/10 text-primary ring-1 ring-primary/20";
      case "cancelled":
        return "border-destructive/20 bg-destructive/10 text-destructive ring-1 ring-destructive/20";
      case "due":
        return "border-chart-4/20 bg-chart-4/10 text-chart-4 ring-1 ring-chart-4/20";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      case "due":
        return "Payment Due";
      default:
        return status;
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);

    try {
      // TODO: Implement actual cancellation logic
      // This is just a placeholder for now
      toast.info("Subscription cancellation will be implemented soon");

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowCancelConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const isExpired = new Date(subscription.end_date) < new Date();
  const nextBillingDate = formatDate(subscription.end_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription>
            View and manage your Pro subscription details
          </DialogDescription>
        </DialogHeader>

        {!showCancelConfirmation ? (
          <div className="space-y-4">
            {/* Subscription Status */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pro Plan</CardTitle>
                  <Badge className={getStatusColor(subscription.status)}>
                    {getStatusText(subscription.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {subscription.status === "cancelled"
                      ? "Access until:"
                      : "Next billing:"}
                  </span>
                  <span className="font-medium">{nextBillingDate}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {formatDate(subscription.start_date)}
                  </span>
                </div>

                {isExpired && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Your subscription has expired</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {subscription.status === "active" && !isExpired && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirmation(true)}
                  className="w-full"
                >
                  Cancel Subscription
                </Button>
              )}

              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* Cancel Confirmation */
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">
                  Cancel Subscription
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your subscription will be cancelled, but you&apos;ll continue
                  to have access to Pro features until {nextBillingDate}. After
                  that, your account will revert to the free plan.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirmation(false)}
                disabled={isCancelling}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1"
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
