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

  // Sort invoices: finalized first, then paid, then others
  const sortedInvoices = [...invoices].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      finalized: 1,
      paid: 2,
      draft: 3,
      void: 4,
    };
    const orderA = statusOrder[a.status.toLowerCase()] || 999;
    const orderB = statusOrder[b.status.toLowerCase()] || 999;
    if (orderA !== orderB) return orderA - orderB;
    // If same status, sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Separate invoices by status
  const finalizedInvoices = sortedInvoices.filter((inv) => inv.status === "finalized");
  const paidInvoices = sortedInvoices.filter((inv) => inv.status === "paid");
  const otherInvoices = sortedInvoices.filter(
    (inv) => inv.status !== "finalized" && inv.status !== "paid"
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle>Invoices & Billing</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No invoices yet
          </p>
        ) : (
          <div className="space-y-6">
            {/* Outstanding Invoices (Finalized) */}
            {finalizedInvoices.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Outstanding Invoices</h4>
                {finalizedInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">
                          Invoice {invoice.invoice_number}
                        </span>
                        {invoice.due_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Due: {formatDate(invoice.due_date)}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusVariant(invoice.status) as any}>
                        {invoice.status}
                      </Badge>
                    </div>
                    
                    <div className="text-2xl font-bold">
                      {formatAmount(calculateInvoiceTotal(invoice))}
                    </div>
                    
                    {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
                      <div className="space-y-1">
                        {invoice.invoice_lines.length === 1 ? (
                          <p className="text-sm text-muted-foreground">
                            {invoice.invoice_lines[0].description}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {invoice.invoice_lines.map((line, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                {line.description} - {line.quantity} hrs @ ${(line.unit_cents / 100).toFixed(2)}/hr
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePayInvoice(invoice)}
                      disabled={processingInvoiceId === invoice.id}
                      data-testid={`button-pay-invoice-${invoice.id}`}
                    >
                      {processingInvoiceId === invoice.id ? (
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
                  </div>
                ))}
              </div>
            )}

            {/* Paid Invoices */}
            {paidInvoices.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Paid Invoices</h4>
                <div className="space-y-2">
                  {paidInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-3 border rounded-lg space-y-2 bg-green-50/50 dark:bg-green-950/20"
                      data-testid={`invoice-${invoice.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">
                            Invoice {invoice.invoice_number}
                          </span>
                          {invoice.paid_date && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Paid: {formatDate(invoice.paid_date)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {formatAmount(calculateInvoiceTotal(invoice))}
                          </span>
                          <Badge variant="default" className="text-xs bg-green-600">
                            ✓ Paid
                          </Badge>
                        </div>
                      </div>
                      {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {invoice.invoice_lines.length === 1
                            ? invoice.invoice_lines[0].description
                            : `${invoice.invoice_lines.length} line items`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Invoices (Draft, etc.) */}
            {otherInvoices.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Other Invoices</h4>
                <div className="space-y-2">
                  {otherInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between text-sm py-2 px-3 border rounded-lg"
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
