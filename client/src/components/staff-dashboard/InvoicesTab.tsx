import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useClients } from "@/hooks/useClients";
import { useAircraft } from "@/hooks/useAircraft";
import { useInvoices } from "@/hooks/useInvoices";
import { useCreateInvoice } from "@/hooks/useCreateInvoice";

export function InvoicesTab() {
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();
  const { data: clients = [] } = useClients();
  const { data: aircraft = [] } = useAircraft();
  const { data: invoices = [], isLoading: isLoadingInvoices, error: invoicesError, refetch: refetchInvoices } = useInvoices();
  const createInvoiceMutation = useCreateInvoice();

  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [hours, setHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("150");
  const [showPreview, setShowPreview] = useState(false);

  const selectedOwner = clients.find((o: any) => o.id === selectedOwnerId);
  const selectedAircraft = aircraft.find((a: any) => a.id === selectedAircraftId);

  const totalAmount = (parseFloat(hours || "0") * parseFloat(ratePerHour || "0")).toFixed(2);

  const handleCreateInvoice = () => {
    createInvoiceMutation.mutate({
      ownerId: selectedOwnerId,
      aircraftId: selectedAircraftId,
      description,
      flightDate,
      hours,
      ratePerHour
    }, {
      onSuccess: () => {
        setShowPreview(false);
        // Reset form
        setSelectedOwnerId("");
        setSelectedAircraftId("");
        setDescription("");
        setFlightDate("");
        setHours("");
        setRatePerHour("150");
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId} required>
                  <SelectTrigger id="client" data-testid="select-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name || client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aircraft">Aircraft (Optional)</Label>
                <Select value={selectedAircraftId} onValueChange={setSelectedAircraftId}>
                  <SelectTrigger id="aircraft" data-testid="select-aircraft">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Aircraft</SelectItem>
                    {aircraft.map((ac: any) => (
                      <SelectItem key={ac.id} value={ac.id}>
                        {ac.tail_number} - {ac.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  data-testid="input-description"
                  placeholder="e.g., Flight Instruction"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Flight Date *</Label>
                <Input
                  id="date"
                  data-testid="input-date"
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Hours *</Label>
                <Input
                  id="hours"
                  data-testid="input-hours"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g., 1.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Hourly Rate ($) *</Label>
                <Input
                  id="rate"
                  data-testid="input-rate"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g., 150"
                  value={ratePerHour}
                  onChange={(e) => setRatePerHour(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${totalAmount}</p>
              </div>
              <Button 
                type="submit" 
                data-testid="button-preview-invoice"
                size="lg"
              >
                Preview Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review the invoice details before sending to the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-base font-medium">{selectedOwner?.full_name || selectedOwner?.email || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Aircraft</p>
                <p className="text-base font-mono font-semibold">{selectedAircraft?.tail_number || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-base">{description || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Flight Date</p>
                <p className="text-base">{flightDate ? format(new Date(flightDate), 'MMM d, yyyy') : 'N/A'}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Line Items</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium mb-1">{description} - {flightDate ? format(new Date(flightDate), 'MMM d, yyyy') : ''}</p>
                    <p className="text-sm text-muted-foreground">
                      {hours} {parseFloat(hours) === 1 ? 'hr' : 'hrs'} × ${parseFloat(ratePerHour).toFixed(2)}/hr
                    </p>
                  </div>
                  <p className="text-lg font-bold ml-4">${totalAmount}</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <p className="text-lg font-semibold">Total Amount</p>
              <p className="text-2xl font-bold">${totalAmount}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={createInvoiceMutation.isPending}
              data-testid="button-send-to-client"
              size="lg"
            >
              {createInvoiceMutation.isPending ? "Sending..." : "Send to Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Instruction Invoices</h3>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'All invoices' : 'Your invoices'}
            </p>
          </div>
          {invoices.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {invoicesError ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive font-medium mb-2">Error loading invoices</p>
              <p className="text-sm text-muted-foreground mb-4">
                {invoicesError instanceof Error ? invoicesError.message : 'Unknown error occurred'}
              </p>
              {!user && (
                <p className="text-sm text-muted-foreground mb-4">
                  Please log in to view invoices.
                </p>
              )}
              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchInvoices()}
                >
                  Retry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : isLoadingInvoices ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading invoices...</p>
            </CardContent>
          </Card>
        ) : !user ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-2">Authentication required</p>
              <p className="text-sm text-muted-foreground">
                Please log in to view and manage invoices.
              </p>
            </CardContent>
          </Card>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-2">No instruction invoices yet.</p>
              <p className="text-sm text-muted-foreground">
                Create an invoice using the form above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {invoices
              .filter((invoice) => invoice && invoice.id)
              .map((invoice) => {
              // Calculate total from all invoice lines
              let calculatedTotal = invoice.amount;
              if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
                calculatedTotal = invoice.invoice_lines.reduce((sum, line) => {
                  return sum + (line.quantity * line.unit_cents / 100);
                }, 0);
              }
              
              return (
                <Card key={invoice.id} data-testid={`invoice-${invoice.id}`} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg font-mono">
                            {invoice.aircraft?.tail_number || 'N/A'}
                          </CardTitle>
                          <Badge 
                            variant={
                              invoice.status === 'paid' ? 'default' :
                              invoice.status === 'finalized' || invoice.status === 'sent' ? 'secondary' :
                              'outline'
                            }
                            data-testid={`badge-status-${invoice.id}`}
                            className="capitalize"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.owner?.full_name || invoice.owner?.email || 'Unknown Client'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          Invoice #{invoice.invoice_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total</p>
                        <p className="text-2xl font-bold">${calculatedTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Line Items</p>
                          <div className="space-y-2">
                            {invoice.invoice_lines.map((line, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{line.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {line.quantity} {line.quantity === 1 ? 'hr' : 'hrs'} × ${(line.unit_cents / 100).toFixed(2)}/hr
                                  </p>
                                </div>
                                <p className="text-sm font-semibold">
                                  ${(line.quantity * line.unit_cents / 100).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-4">
                          {invoice.created_at && (
                            <div>
                              <p className="text-xs text-muted-foreground">Created</p>
                              <p className="text-sm">
                                {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          )}
                          {invoice.due_date && (
                            <div>
                              <p className="text-xs text-muted-foreground">Due Date</p>
                              <p className="text-sm">
                                {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          {(invoice.status === 'finalized' || invoice.status === 'sent') && (
                            <p className="text-sm text-muted-foreground">
                              Sent to client
                            </p>
                          )}
                          
                          {invoice.status === 'paid' && invoice.paid_date && (
                            <div>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                ✓ Paid
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(invoice.paid_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

