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
import { Mail, User, Plane, Pencil, Info } from "lucide-react";
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
  const [editClientId, setEditClientId] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");

  // Fetch all clients (owners)
  const { data: clients = [], isLoading } = useQuery({
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
        throw error;
      }
      
      // For each client, count their aircraft separately
      const clientsWithCounts = await Promise.all(
        (data || []).map(async (client: any) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Client Management</h2>
          <p className="text-sm text-muted-foreground">View and manage owner accounts</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Clients shown here are users with role='owner'. If a user signed up but isn't showing, 
          their role may need to be set to 'owner' in the database.
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
