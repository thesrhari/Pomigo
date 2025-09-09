import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download, Receipt, Loader2 } from "lucide-react";
import { Invoice } from "@/lib/hooks/useSubscriptionManagement";

interface InvoicesCardProps {
  invoices: Invoice[];
  loading: boolean;
  onDownload: (transactionId: string) => Promise<void>;
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export const InvoicesCard: React.FC<InvoicesCardProps> = ({
  invoices,
  loading,
  onDownload,
  currentPage,
  hasNextPage,
  onPageChange,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleDownload = async (transactionId: string) => {
    setDownloadingId(transactionId);
    try {
      await onDownload(transactionId);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoices & Receipts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No invoices found.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {invoice.amount / 100} {invoice.currency.toUpperCase()}
                      </span>
                      <Badge className="border-primary/20 bg-primary/10 text-primary ring-1 ring-primary/20">
                        {formatStatus(invoice.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created_at), "MMM dd, yyyy")} •{" "}
                      Transaction ID: {invoice.transaction_id}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(invoice.transaction_id)}
                    disabled={
                      !!downloadingId ||
                      invoice.status.toLowerCase() !== "completed"
                    }
                  >
                    {downloadingId === invoice.transaction_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {(currentPage > 1 || hasNextPage) && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePreviousPage();
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNextPage();
                      }}
                      className={
                        !hasNextPage
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
