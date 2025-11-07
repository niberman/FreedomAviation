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
import { supabase } from "@/lib/supabase";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editClientId, setEditClientId] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Fetch all clients (owners)
  const { data: clients = [], isLoading, error: clientsError } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      console.log('[ClientsTable] Fetching clients...');
      
      // Fetch owners - without the problematic aircraft count aggregation
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          created_at
        `)
        .eq('role', 'owner')
        .order('created_at', { ascending: false });
      
      console.log('[ClientsTable] Owners query result:', { data, error });
      
      if (error) {
        console.error('[ClientsTable] Error fetching clients:', error);
        // Check if it's a permission error
        if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('RLS')) {
          throw new Error('Permission denied. Please ensure you are logged in as an admin or CFI.');
        }
        throw error;
      }
      
      if (!data) {
        console.warn('[ClientsTable] No data returned from query');
        return [];
      }
      
      // For each client, count their aircraft separately
      const clientsWithCounts = await Promise.all(
        data.map(async (client: any) => {
          const { count } = await supabase
            .from('aircraft')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', client.id);
          
          return {
            ...client,
            aircraft_count: count || 0,
          };
        })
      );
      
      console.log('[ClientsTable] Clients with aircraft counts:', clientsWithCounts);
      return clientsWithCounts;
    },
    retry: false,
  });

  // Create new client
  const createClientMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/clients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newClientEmail,
          password: newClientPassword,
          full_name: newClientName,
          phone: newClientPhone || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create client');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/owners'] });
      setIsAddDialogOpen(false);
      setNewClientEmail("");
      setNewClientPassword("");
      setNewClientName("");
      setNewClientPhone("");
      toast({
        title: "Client created",
        description: "New client has been created successfully.",
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
    if (!newClientEmail || !newClientPassword || !newClientName) {
      toast({
        title: "Missing required fields",
        description: "Email, password, and name are required.",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Client Management</h2>
          <p className="text-sm text-muted-foreground">View and manage owner accounts</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          data-testid="button-add-client"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
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
            <Table>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClient(client)}
                        data-testid={`button-edit-${client.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client account. They will be able to log in with the email and password you provide.
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  placeholder="Enter password"
                  value={newClientPassword}
                  onChange={(e) => setNewClientPassword(e.target.value)}
                  data-testid="input-add-client-password"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
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
                {createClientMutation.isPending ? "Creating..." : "Create Client"}
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
    </div>
  );
}
