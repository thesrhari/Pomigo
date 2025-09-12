"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import { useSubscriptionManagement } from "@/lib/hooks/useSubscriptionManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SubscriptionPlanCard } from "./components/SubscriptionPlanCard";
import { SubscriptionActionsCard } from "./components/SubscriptionActionsCard";
import { InvoicesCard } from "./components/InvoicesCard";

export default function SubscriptionPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user, loading: profileLoading } = useProfile();

  const {
    subscription,
    invoices,
    loading,
    invoicesLoading,
    cancelling,
    reactivating,
    isLifetime,
    isActive,
    isCancelled,
    hasAccess,
    getPlanName,
    cancelSubscription,
    reactivateSubscription,
    downloadInvoice,
    currentPage,
    hasNextPage,
    handlePageChange,
  } = useSubscriptionManagement();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || profileLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl p-8 text-center">
        <h2 className="text-2xl font-semibold">Authentication Required</h2>
        <p className="mt-2 text-muted-foreground">
          Please log in to manage your subscription.
        </p>
        <Button className="mt-4" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Subscription Management
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Manage your subscription, billing, and invoices.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">
            Loading subscription details...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SubscriptionPlanCard
              subscription={subscription || null}
              planName={getPlanName()}
            />

            <SubscriptionActionsCard
              subscription={subscription || null}
              isLifetime={isLifetime!}
              isActive={isActive}
              isCancelled={isCancelled}
              hasAccess={hasAccess}
              cancelling={cancelling}
              reactivating={reactivating}
              onCancel={cancelSubscription}
              onReactivate={reactivateSubscription}
            />
          </div>

          <div className="space-y-6">
            <InvoicesCard
              invoices={invoices}
              loading={invoicesLoading}
              onDownload={downloadInvoice}
              currentPage={currentPage}
              hasNextPage={hasNextPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
