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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, User, Plane, Pencil, Info, Plus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [editClientId, setEditClientId] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Fetch all clients (owners)
  const accessToken = session?.access_token ?? null;

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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-2xl font-semibold">Client Management</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">View and manage owner accounts</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          data-testid="button-add-client"
          className="w-full sm:w-auto touch-manipulation"
        >
          <Plus className="h-4 w-4 mr-2" />
          Invite Client
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs sm:text-sm">
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
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
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
            className="touch-manipulation text-xs sm:text-sm w-full sm:w-auto"
          >
            Set all users without role to 'owner'
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Clients ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No clients found. Clients must sign up through the authentication system first.
            </p>
          ) : (
            <div className="w-full overflow-x-auto scroll-smooth-touch scrollbar-hide -mx-2 sm:mx-0">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Name</TableHead>
                    <TableHead className="text-xs sm:text-sm">Email</TableHead>
                    <TableHead className="text-xs sm:text-sm">Phone</TableHead>
                    <TableHead className="text-xs sm:text-sm">Aircraft</TableHead>
                    <TableHead className="text-xs sm:text-sm">Joined</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client: Client) => (
                    <TableRow key={client.id} data-testid={`client-row-${client.id}`}>
                      <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{client.full_name}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{client.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                        {client.phone || "—"}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Plane className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          {client.aircraft_count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                        {new Date(client.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClient(client)}
                          data-testid={`button-edit-${client.id}`}
                          className="h-8 w-8 p-0 touch-manipulation"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Invite New Client</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Send an invitation to a new client. They will receive an email with a secure link to set their own password and access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClient}>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="add-email" className="text-sm">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="client@example.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  data-testid="input-add-client-email"
                  required
                  className="text-sm touch-manipulation"
                />
                <p className="text-xs text-muted-foreground">
                  An invitation email will be sent to this address
                </p>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="add-name" className="text-sm">Full Name *</Label>
                <Input
                  id="add-name"
                  placeholder="John Doe"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  data-testid="input-add-client-name"
                  required
                  className="text-sm touch-manipulation"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="add-phone" className="text-sm">Phone (optional)</Label>
                <Input
                  id="add-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  data-testid="input-add-client-phone"
                  className="text-sm touch-manipulation"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="w-full sm:w-auto touch-manipulation"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                data-testid="button-create-client"
                className="w-full sm:w-auto touch-manipulation"
              >
                {createClientMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Client</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update client information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient}>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-name" className="text-sm">Full Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  data-testid="input-edit-client-name"
                  required
                  className="text-sm touch-manipulation"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-phone" className="text-sm">Phone (optional)</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={editClientPhone}
                  onChange={(e) => setEditClientPhone(e.target.value)}
                  data-testid="input-edit-client-phone"
                  className="text-sm touch-manipulation"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto touch-manipulation"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateClientMutation.isPending}
                data-testid="button-update-client"
                className="w-full sm:w-auto touch-manipulation"
              >
                {updateClientMutation.isPending ? "Updating..." : "Update Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
