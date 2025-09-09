// components/subscription/SubscriptionPlanCard.tsx
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, CreditCard } from "lucide-react";
import { SubscriptionDetails } from "@/lib/hooks/useSubscriptionManagement";

interface SubscriptionPlanCardProps {
  subscription: SubscriptionDetails | null;
  planName: string;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  subscription,
  planName,
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusColor = (status?: string) => {
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

  const getStatusText = (status?: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      case "due":
        return "Payment Due";
      default:
        return "Free";
    }
  };

  const isLifetime = subscription && !subscription.subscription_id;
  const nextBillingDate = subscription?.end_date
    ? formatDate(subscription.end_date)
    : null;
  const amount = subscription?.amount;
  const currency = subscription?.currency || "USD";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Current Plan
          </CardTitle>
          <Badge className={getStatusColor(subscription?.status)}>
            {getStatusText(subscription?.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{planName}</h3>
          {amount && (
            <p className="text-muted-foreground">
              ${amount / 100}/
              {subscription?.payment_frequency_interval?.toLowerCase()}
            </p>
          )}
        </div>

        {subscription && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Started:</span>
              <span className="font-medium">
                {formatDate(subscription.start_date)}
              </span>
            </div>

            {nextBillingDate && !isLifetime && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {subscription.status === "cancelled"
                    ? "Access until:"
                    : "Next billing:"}
                </span>
                <span className="font-medium">{nextBillingDate}</span>
              </div>
            )}

            {subscription.card_last_four && subscription.card_network && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Payment method:</span>
                <span className="font-medium">
                  {subscription.card_network} ending in{" "}
                  {subscription.card_last_four}
                </span>
              </div>
            )}

            {subscription.cancel_at_next_billing_date && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Your subscription will be cancelled at the end of the current
                  billing period.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
