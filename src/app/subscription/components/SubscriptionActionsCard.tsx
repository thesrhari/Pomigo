// components/subscription/SubscriptionActionsCard.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SubscriptionDetails } from "@/lib/hooks/useSubscriptionManagement";
import { PricingModal } from "@/components/PricingModal";

interface SubscriptionActionsCardProps {
  subscription: SubscriptionDetails | null;
  isLifetime: boolean;
  isActive: boolean;
  isCancelled: boolean;
  hasAccess: boolean;
  cancelling: boolean;
  reactivating: boolean;
  onCancel: () => Promise<void>;
  onReactivate: () => Promise<void>;
}

export const SubscriptionActionsCard: React.FC<
  SubscriptionActionsCardProps
> = ({
  subscription,
  isLifetime,
  isActive,
  hasAccess,
  cancelling,
  reactivating,
  onCancel,
  onReactivate,
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const handleCancel = async () => {
    await onCancel();
    setShowCancelDialog(false);
  };

  if (isLifetime) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You have lifetime access to Pro features. No further action needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Pro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You&apos;re currently on the free plan. Upgrade to unlock Pro
              features.
            </p>
            <Button
              className="w-full cursor-pointer"
              onClick={() => setIsPricingModalOpen(true)}
            >
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Subscription Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isActive && !subscription.cancel_at_next_billing_date && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelling}
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Subscription
            </Button>
          )}

          {subscription.cancel_at_next_billing_date && hasAccess && (
            <Button
              className="w-full"
              onClick={onReactivate}
              disabled={reactivating}
            >
              {reactivating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reactivate Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              <span>
                Are you sure you want to cancel your subscription? You&apos;ll
                continue to have access to Pro features until your current
                billing period ends
                {subscription?.end_date && (
                  <span className="font-medium">
                    {" "}
                    on {new Date(subscription.end_date).toLocaleDateString()}
                  </span>
                )}
                .
              </span>
              <span>
                After that, your account will revert to the free plan.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
