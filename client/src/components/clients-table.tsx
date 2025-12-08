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
import { Mail, User, Plane, Pencil, Info, Plus, Eye, DollarSign, FileText, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
  aircraft_count?: number;
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

  // Fetch all clients (owners)
  const accessToken = session?.access_token ?? null;

  // Fetch detailed client information when a client is selected
  const { data: clientDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/api/client-details', selectedClientId],
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
    enabled: !!selectedClientId,
  });

  const { data: clients = [], isLoading, error: clientsError } = useQuery({
    queryKey: ['/api/clients', accessToken],
    queryFn: async () => {
      console.log('[ClientsTable] Fetching clients from API...');
      
      // IMPORTANT: Fetch from API endpoint, NOT directly from Supabase
      // The API uses service role to bypass RLS
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ClientsTable] Error fetching clients:', errorText);
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ClientsTable] Clients from API:', data);
      
      // API returns {clients: [...], total: 12}, extract the clients array
      return data.clients || [];
    },
    enabled: !!accessToken,
    retry: false,
  });

  // Create new client
  const createClientMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      console.log('Creating client with:', {
        email: newClientEmail,
        full_name: newClientName,
        phone: newClientPhone || null,
      });

      const response = await fetch('/api/clients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: newClientEmail,
          full_name: newClientName,
          phone: newClientPhone || null,
          sendInvite: true,
        }),
      });

      const data = await response.json();
      console.log('Server response:', { status: response.status, data });
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create client');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/owners'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/owners'] });
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
    setEditClientName(client.full_name);
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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Clients shown here are users with role='owner'. If a user signed up but isn't showing, 
          their role may need to be set to 'owner' in the database.
          {clients.length === 0 && !isLoading && !clientsError && (
            <span className="block mt-2 text-xs">
              No clients found. This could mean: (1) No users have role='owner', (2) RLS policies are blocking access, 
              or (3) Users need to be created. Check the browser console for detailed error messages.
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Temporary: Show button to fix Noah's role */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-2">
            Quick fix: If you have users in the database without the 'owner' role, click below to update them:
          </p>
          <Button
            size="sm"
            onClick={async () => {
              const { data: usersWithoutRole } = await supabase
                .from('user_profiles')
                .select('id, email')
                .is('role', null);
              
              if (usersWithoutRole && usersWithoutRole.length > 0) {
                for (const user of usersWithoutRole) {
                  await supabase
                    .from('user_profiles')
                    .update({ role: 'owner' })
                    .eq('id', user.id);
                }
                toast({
                  title: "Roles updated",
                  description: `Updated ${usersWithoutRole.length} user(s) to role='owner'`,
                });
                queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
              } else {
                toast({
                  title: "No updates needed",
                  description: "All users already have roles assigned.",
                });
              }
            }}
            data-testid="button-fix-roles"
          >
            Set all users without role to 'owner'
          </Button>
        </CardContent>
      </Card>

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
                        {new Date(client.created_at).toLocaleDateString()}
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
    </div>
  );
}
