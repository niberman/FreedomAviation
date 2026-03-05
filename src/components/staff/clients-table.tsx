import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mail, User, Plane, Pencil, Plus, Eye, DollarSign, FileText, Clock, Send, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiJson } from "@/lib/api-client";
import type { Client } from "@/hooks/useClients";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateInvoice } from "@/hooks/useInvoices";
import { useResendInvoice } from "@/hooks/useResendInvoice";

interface EditableLineItem {
  id: string;
  description: string;
  quantity: string;
  rate: string;
}


export function ClientsTable() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Invoice edit state
  const [isInvoiceEditOpen, setIsInvoiceEditOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editFlightDate, setEditFlightDate] = useState('');
  const [editHours, setEditHours] = useState('1');
  const [editRate, setEditRate] = useState('100');
  const [editNotes, setEditNotes] = useState('');
  const [editLineItems, setEditLineItems] = useState<EditableLineItem[]>([
    { id: '1', description: '', quantity: '1', rate: '0' },
  ]);

  const updateInvoiceMutation = useUpdateInvoice();
  const resendInvoiceMutation = useResendInvoice({
    invalidateQueryKeys: [['client-details', selectedClientId]],
  });

  // Fetch all clients (owners)
  const accessToken = session?.access_token ?? null;

  // Fetch detailed client information when a client is selected
  const { data: clientDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['client-details', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;

      // Fetch client profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', selectedClientId)
        .single();

      if (profileError) throw profileError;

      // Fetch client's aircraft
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .eq('owner_id', selectedClientId);

      if (aircraftError) throw aircraftError;

      // Fetch client's invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          aircraft:aircraft_id(tail_number, model),
          invoice_lines(*)
        `)
        .eq('owner_id', selectedClientId)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch client's service requests
      const { data: serviceRequests, error: requestsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          aircraft:aircraft_id(tail_number)
        `)
        .eq('user_id', selectedClientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (requestsError) throw requestsError;

      return {
        profile,
        aircraft: aircraft || [],
        invoices: invoices || [],
        serviceRequests: serviceRequests || [],
      };
    },
    enabled: !!selectedClientId && !!session?.access_token,
  });

  const { data: clients = [], isLoading, error: clientsError } = useQuery({
    queryKey: ['/api/clients', accessToken],
    queryFn: async () => {
      const data = await apiJson<{ clients?: Client[] }>('/api/clients');
      return data.clients ?? [];
    },
    enabled: !!accessToken,
    retry: false,
  });

  // Create new client
  const createClientMutation = useMutation({
    mutationFn: async () => {
      return apiJson<{ message?: string }>('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          email: newClientEmail,
          full_name: newClientName,
          phone: newClientPhone || null,
          sendInvite: true,
        }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      setIsAddDialogOpen(false);
      setNewClientEmail("");
      setNewClientName("");
      setNewClientPhone("");
      toast({
        title: "Invitation sent!",
        description: data.message || "The user will receive an email to set their password and access the dashboard.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update existing client
  const updateClientMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editClientName,
          phone: editClientPhone || null,
        })
        .eq('id', editClientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      setIsEditDialogOpen(false);
      setEditClientId("");
      setEditClientName("");
      setEditClientPhone("");
      toast({
        title: "Client updated",
        description: "Client information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewClient = (client: Client) => {
    setSelectedClientId(client.id);
    setIsViewDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditClientId(client.id);
    setEditClientName(client.full_name ?? "");
    setEditClientPhone(client.phone || "");
    setIsEditDialogOpen(true);
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientEmail || !newClientName) {
      toast({
        title: "Missing required fields",
        description: "Email and name are required.",
        variant: "destructive",
      });
      return;
    }
    createClientMutation.mutate();
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientName) {
      toast({
        title: "Missing name",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }
    updateClientMutation.mutate();
  };

  const openInvoiceEditor = (invoice: any) => {
    if (invoice.status === 'paid') return;

    setEditingInvoice(invoice);
    setEditNotes(invoice.notes || '');

    const lines = invoice.invoice_lines || [];
    const mapped = lines.map((line: any, idx: number) => ({
      id: `${idx}`,
      description: line.description || '',
      quantity: String(line.quantity ?? 1),
      rate: String(((line.unit_cents ?? 0) as number) / 100),
    }));
    setEditLineItems(mapped.length > 0 ? mapped : [{ id: '1', description: '', quantity: '1', rate: '0' }]);

    if (invoice.category === 'instruction') {
      const firstLine = lines[0];
      if (firstLine) {
        const parts = String(firstLine.description || '').split(' - ');
        const maybeDate = parts.pop();
        const descPart = parts.join(' - ');
        const validDate = maybeDate && !Number.isNaN(Date.parse(maybeDate))
          ? new Date(maybeDate).toISOString().split('T')[0]
          : '';
        setEditDescription(validDate ? descPart : (firstLine.description || ''));
        setEditFlightDate(validDate);
        setEditHours(String(firstLine.quantity ?? 1));
        setEditRate(String(((firstLine.unit_cents ?? 0) as number) / 100));
      } else {
        setEditDescription('');
        setEditFlightDate('');
        setEditHours('1');
        setEditRate('100');
      }
    }

    setIsInvoiceEditOpen(true);
  };

  const handleSaveInvoiceEdit = () => {
    if (!editingInvoice) return;

    const payloadLineItems = editingInvoice.category === 'instruction'
      ? [{
          description: editFlightDate ? `${editDescription} - ${editFlightDate}` : editDescription,
          quantity: parseFloat(editHours || '0'),
          unit_cents: Math.round(parseFloat(editRate || '0') * 100),
        }]
      : editLineItems.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity || '0'),
          unit_cents: Math.round(parseFloat(item.rate || '0') * 100),
        }));

    updateInvoiceMutation.mutate({
      invoiceId: editingInvoice.id,
      notes: editingInvoice.category === 'maintenance' ? editNotes : undefined,
      lineItems: payloadLineItems,
    }, {
      onSuccess: () => {
        setIsInvoiceEditOpen(false);
        setEditingInvoice(null);
        queryClient.invalidateQueries({ queryKey: ['client-details', selectedClientId] });
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Loading clients...</p>
        </CardContent>
      </Card>
    );
  }

  if (clientsError) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertDescription>
              <p className="font-semibold mb-2">Error loading clients</p>
              <p className="text-sm">
                {clientsError instanceof Error 
                  ? clientsError.message 
                  : 'Failed to load client list. Please check your permissions and try again.'}
              </p>
              {clientsError instanceof Error && clientsError.message.includes('Permission') && (
                <p className="text-xs mt-2">
                  Make sure you're logged in as an admin or CFI with proper permissions.
                </p>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Client Management</h2>
          <p className="text-sm text-muted-foreground">View and manage owner accounts</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          data-testid="button-add-client"
        >
          <Plus className="h-4 w-4 mr-2" />
          Invite Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Clients ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No clients found. Clients must sign up through the authentication system first.
            </p>
          ) : (
            <div className="w-full overflow-x-auto scroll-smooth-touch scrollbar-hide">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client: Client) => (
                    <TableRow key={client.id} data-testid={`client-row-${client.id}`}>
                      <TableCell className="font-medium">{client.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {client.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                          {client.aircraft_count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewClient(client)}
                            data-testid={`button-view-${client.id}`}
                            title="View full details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClient(client)}
                            data-testid={`button-edit-${client.id}`}
                            title="Edit client"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Client</DialogTitle>
            <DialogDescription>
              Send an invitation to a new client. They will receive an email with a secure link to set their own password and access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClient}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="client@example.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  data-testid="input-add-client-email"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  An invitation email will be sent to this address
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name *</Label>
                <Input
                  id="add-name"
                  placeholder="John Doe"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  data-testid="input-add-client-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone (optional)</Label>
                <Input
                  id="add-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  data-testid="input-add-client-phone"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                data-testid="button-create-client"
              >
                {createClientMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  data-testid="input-edit-client-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone (optional)</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={editClientPhone}
                  onChange={(e) => setEditClientPhone(e.target.value)}
                  data-testid="input-edit-client-phone"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateClientMutation.isPending}
                data-testid="button-update-client"
              >
                {updateClientMutation.isPending ? "Updating..." : "Update Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Client Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Client Details</DialogTitle>
            <DialogDescription>
              Complete information about this client
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading client details...</p>
            </div>
          ) : clientDetails ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="text-base font-semibold">{clientDetails.profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base">{clientDetails.profile.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-base">{clientDetails.profile.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Role</p>
                      <Badge variant="outline" className="capitalize">{clientDetails.profile.role}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base">
                          {format(new Date(clientDetails.profile.created_at), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Plane className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{clientDetails.aircraft.length}</p>
                        <p className="text-sm text-muted-foreground">Aircraft</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{clientDetails.invoices.length}</p>
                        <p className="text-sm text-muted-foreground">Invoices</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{clientDetails.serviceRequests.length}</p>
                        <p className="text-sm text-muted-foreground">Requests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="aircraft" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5" />
                      Owned Aircraft ({clientDetails.aircraft.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientDetails.aircraft.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No aircraft registered yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {clientDetails.aircraft.map((ac: any) => (
                          <div key={ac.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-mono font-bold text-lg">{ac.tail_number}</p>
                                <p className="text-sm text-muted-foreground">{ac.model}</p>
                                <div className="flex gap-4 mt-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Year:</span>{" "}
                                    <span className="font-medium">{ac.year || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Hobbs:</span>{" "}
                                    <span className="font-medium">{ac.hobbs_hours || "—"}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="capitalize">{ac.status || "active"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoices" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Invoices ({clientDetails.invoices.length})
                    </CardTitle>
                    <CardDescription>
                      Complete invoice and payment history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {clientDetails.invoices.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No invoices yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {clientDetails.invoices.map((invoice: any) => {
                          // Calculate total from invoice lines
                          let total = invoice.amount;
                          if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
                            total = invoice.invoice_lines.reduce(
                              (sum: number, line: any) => sum + (line.quantity * line.unit_cents / 100),
                              0
                            );
                          }

                          return (
                            <div key={invoice.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-mono font-semibold">
                                    Invoice #{invoice.invoice_number}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {invoice.aircraft?.tail_number || "No aircraft"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold">${total.toFixed(2)}</p>
                                  <Badge
                                    variant={
                                      invoice.status === "paid"
                                        ? "default"
                                        : invoice.status === "finalized"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="capitalize mt-1"
                                  >
                                    {invoice.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
                                <div className="space-y-2 mb-3 text-sm">
                                  {invoice.invoice_lines.map((line: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                                      <span>{line.description}</span>
                                      <span className="font-medium">
                                        {line.quantity} hrs × ${(line.unit_cents / 100).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t">
                                <span>Created: {format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
                                {invoice.paid_date && (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    ✓ Paid: {format(new Date(invoice.paid_date), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                              {invoice.status !== 'paid' && (
                                <div className="flex gap-2 pt-3 border-t mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openInvoiceEditor(invoice)}
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resendInvoiceMutation.mutate(invoice.id)}
                                    disabled={resendInvoiceMutation.isPending}
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    {resendInvoiceMutation.isPending ? 'Sending...' : 'Send Again'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Invoiced</p>
                        <p className="text-2xl font-bold">
                          ${clientDetails.invoices
                            .reduce((sum: number, inv: any) => {
                              let total = inv.amount;
                              if (inv.invoice_lines && inv.invoice_lines.length > 0) {
                                total = inv.invoice_lines.reduce(
                                  (lineSum: number, line: any) =>
                                    lineSum + (line.quantity * line.unit_cents / 100),
                                  0
                                );
                              }
                              return sum + total;
                            }, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Paid Invoices</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${clientDetails.invoices
                            .filter((inv: any) => inv.status === "paid")
                            .reduce((sum: number, inv: any) => {
                              let total = inv.amount;
                              if (inv.invoice_lines && inv.invoice_lines.length > 0) {
                                total = inv.invoice_lines.reduce(
                                  (lineSum: number, line: any) =>
                                    lineSum + (line.quantity * line.unit_cents / 100),
                                  0
                                );
                              }
                              return sum + total;
                            }, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Service Requests ({clientDetails.serviceRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientDetails.serviceRequests.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No service requests yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {clientDetails.serviceRequests.map((request: any) => (
                          <div key={request.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{request.service_type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {request.aircraft?.tail_number || "No aircraft"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  request.status === "completed"
                                    ? "default"
                                    : request.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="capitalize"
                              >
                                {request.status}
                              </Badge>
                            </div>
                            {request.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {request.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isInvoiceEditOpen} onOpenChange={setIsInvoiceEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice {editingInvoice?.invoice_number ? `#${editingInvoice.invoice_number}` : ''}</DialogTitle>
            <DialogDescription>
              Update invoice details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <div className="space-y-4 py-2">
              {editingInvoice.category === 'instruction' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Flight Instruction" />
                  </div>
                  <div className="space-y-2">
                    <Label>Flight Date</Label>
                    <Input type="date" value={editFlightDate} onChange={(e) => setEditFlightDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Input type="number" step="0.1" min="0" value={editHours} onChange={(e) => setEditHours(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate ($)</Label>
                    <Input type="number" step="0.01" min="0" value={editRate} onChange={(e) => setEditRate(e.target.value)} />
                  </div>
                  <div className="col-span-full pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">${(parseFloat(editHours || '0') * parseFloat(editRate || '0')).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Optional maintenance notes" rows={3} />
                  </div>
                  <div className="space-y-3">
                    <Label>Line Items</Label>
                    {editLineItems.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                          <Input placeholder="Description" value={item.description} onChange={(e) => setEditLineItems((prev) => prev.map((li) => li.id === item.id ? { ...li, description: e.target.value } : li))} />
                        </div>
                        <div className="col-span-2">
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                          <Input type="number" step="0.1" min="0" placeholder="Qty" value={item.quantity} onChange={(e) => setEditLineItems((prev) => prev.map((li) => li.id === item.id ? { ...li, quantity: e.target.value } : li))} />
                        </div>
                        <div className="col-span-2">
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Rate ($)</Label>}
                          <Input type="number" step="0.01" min="0" placeholder="Rate" value={item.rate} onChange={(e) => setEditLineItems((prev) => prev.map((li) => li.id === item.id ? { ...li, rate: e.target.value } : li))} />
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                          <span className="text-sm font-medium w-16 text-right">${(parseFloat(item.quantity || '0') * parseFloat(item.rate || '0')).toFixed(2)}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={editLineItems.length <= 1} onClick={() => setEditLineItems((prev) => prev.filter((li) => li.id !== item.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditLineItems((prev) => [...prev, { id: `${Date.now()}`, description: '', quantity: '1', rate: '0' }])}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line Item
                    </Button>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">${editLineItems.reduce((sum, li) => sum + parseFloat(li.quantity || '0') * parseFloat(li.rate || '0'), 0).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveInvoiceEdit} disabled={updateInvoiceMutation.isPending}>
              {updateInvoiceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
