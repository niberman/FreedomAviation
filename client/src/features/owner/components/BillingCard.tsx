import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, DollarSign, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createCheckoutSession } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

// Invoice type matching the database structure
interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  category?: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
  invoice_lines?: Array<{
    description: string;
    quantity: number;
    unit_cents: number;
  }>;
}

interface BillingCardProps {
  invoices: Invoice[];
  isLoading: boolean;
}

export function BillingCard({ invoices, isLoading }: BillingCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "default";
      case "finalized":
        return "secondary";
      case "draft":
        return "outline";
      case "void":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to pay invoices",
        variant: "destructive",
      });
      return;
    }

    if (invoice.status !== "finalized") {
      toast({
        title: "Cannot pay invoice",
        description: `This invoice is ${invoice.status} and cannot be paid yet.`,
        variant: "destructive",
      });
      return;
    }

    setProcessingInvoiceId(invoice.id);

    try {
      const { checkoutUrl } = await createCheckoutSession(invoice.id, user.id);
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      const errorMessage = error?.message || error?.toString() || "Failed to initiate payment. Please try again.";
      console.error("Full error details:", {
        error,
        message: errorMessage,
        invoiceId: invoice.id,
        userId: user?.id,
      });
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      setProcessingInvoiceId(null);
    }
  };

  // Calculate total amount for display (use invoice_lines if available, otherwise use amount)
  const calculateInvoiceTotal = (invoice: Invoice): number => {
    if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
      return invoice.invoice_lines.reduce((sum, line) => {
        return sum + (line.quantity * line.unit_cents / 100);
      }, 0);
    }
    return invoice.amount;
  };

  // Find the most relevant invoice to display (finalized > draft > paid)
  const currentInvoice = 
    invoices.find((inv) => inv.status === "finalized") ||
    invoices.find((inv) => inv.status === "draft") ||
    invoices.find((inv) => inv.status === "paid") ||
    invoices[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle>Billing</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : !currentInvoice ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No invoices yet
          </p>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Invoice {currentInvoice.invoice_number}
                </span>
                <Badge variant={getStatusVariant(currentInvoice.status) as any}>
                  {currentInvoice.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {formatAmount(calculateInvoiceTotal(currentInvoice))}
              </div>
              {currentInvoice.invoice_lines && currentInvoice.invoice_lines.length > 0 && currentInvoice.invoice_lines.length === 1 && (
                <p className="text-sm text-muted-foreground">
                  {currentInvoice.invoice_lines[0].description}
                </p>
              )}
              {currentInvoice.invoice_lines && currentInvoice.invoice_lines.length > 1 && (
                <p className="text-sm text-muted-foreground">
                  {currentInvoice.invoice_lines.length} line items
                </p>
              )}
              {currentInvoice.due_date && (
                <p className="text-sm text-muted-foreground">
                  Due: {formatDate(currentInvoice.due_date)}
                </p>
              )}
              {currentInvoice.paid_date && (
                <p className="text-sm text-muted-foreground">
                  Paid: {formatDate(currentInvoice.paid_date)}
                </p>
              )}
              {currentInvoice.status === "finalized" && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => handlePayInvoice(currentInvoice)}
                  disabled={processingInvoiceId === currentInvoice.id}
                  data-testid="button-pay-invoice"
                >
                  {processingInvoiceId === currentInvoice.id ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay Invoice
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </>
                  )}
                </Button>
              )}
              {currentInvoice.status === "paid" && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Payment completed
                </p>
              )}
            </div>

            {invoices.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Invoices</h4>
                <div className="space-y-1">
                  {invoices
                    .filter((inv) => inv.id !== currentInvoice?.id)
                    .slice(0, 5)
                    .map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between text-sm py-1"
                      data-testid={`invoice-${invoice.id}`}
                    >
                      <span className="text-muted-foreground">
                        {invoice.invoice_number}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatAmount(calculateInvoiceTotal(invoice))}
                        </span>
                        <Badge variant={getStatusVariant(invoice.status) as any} className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
