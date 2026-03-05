import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, UserPlus, Edit, Trash2, CheckCircle } from "lucide-react";

const ROLES = {
  admin: { label: "Administrator", color: "bg-red-500" },
  founder: { label: "Founder", color: "bg-purple-500" },
  ops: { label: "Operations", color: "bg-blue-500" },
  cfi: { label: "CFI (Instructor)", color: "bg-green-500" },
  staff: { label: "Staff", color: "bg-gray-500" },
  owner: { label: "Client/Owner", color: "bg-yellow-500" },
} as const;

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: keyof typeof ROLES;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export function StaffManagement() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<keyof typeof ROLES>("staff");

  // Check if current user can manage staff (admin or founder only)
  const { data: currentUserProfile } = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const canManageStaff = currentUserProfile?.role === "admin" || currentUserProfile?.role === "founder";

  // Fetch all staff members
  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, role, phone, created_at")
        .in("role", ["admin", "founder", "ops", "cfi", "staff"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StaffMember[];
    },
    enabled: canManageStaff,
  });

  // Create staff member mutation
  const createStaffMutation = useMutation({
    mutationFn: async () => {
      if (!email || !fullName || !role) {
        throw new Error("Please fill in all required fields");
      }

      // Use server-side API to create staff member (requires service role key)
      const response = await fetch('/api/staff/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
          role,
          sendInvite: true,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create staff member');
      }

      const newUser = result.user;
      if (!newUser) throw new Error("Failed to create user");

      // Update user profile with additional details
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          role,
        })
        .eq("id", newUser.id);

      if (profileError) throw profileError;

      // Send password reset email so they can set their password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      return newUser;
    },
    onSuccess: () => {
      toast({
        title: "Staff member created",
        description: "An email has been sent for them to set their password.",
      });
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setIsAddDialogOpen(false);
      // Reset form
      setEmail("");
      setFullName("");
      setPhone("");
      setRole("staff");
    },
    onError: (error) => {
      toast({
        title: "Error creating staff member",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update staff member mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffMember> }) => {
      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Staff member updated",
        description: "Changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setEditingMember(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating staff member",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete staff member mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      // Note: We can't actually delete the auth user easily
      // Instead, we'll change their role to 'owner' to revoke staff access
      const { error } = await supabase
        .from("user_profiles")
        .update({ role: "owner" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Staff access revoked",
        description: "User has been removed from staff and changed to regular client role.",
      });
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast({
        title: "Error removing staff member",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = () => {
    if (!editingMember) return;
    updateStaffMutation.mutate({
      id: editingMember.id,
      updates: {
        full_name: editingMember.full_name,
        phone: editingMember.phone,
        role: editingMember.role,
      },
    });
  };

  if (!canManageStaff) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            You don't have permission to manage staff members.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading staff members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>
                Manage staff members and their roles
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staffMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No staff members found.</p>
              <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                Add First Staff Member
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge className={ROLES[member.role].color}>
                          {ROLES[member.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.phone || "—"}</TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMember(member)}
                            disabled={member.id === user?.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(member.id)}
                            disabled={member.id === user?.id || member.role === "founder"}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff account. They will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@freedomaviationco.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as keyof typeof ROLES)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([key, config]) => (
                    key !== "owner" && (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={createStaffMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createStaffMutation.mutate()}
              disabled={createStaffMutation.isPending}
            >
              {createStaffMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Staff Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member details and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingMember.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={editingMember.full_name}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    full_name: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editingMember.phone || ""}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    phone: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editingMember.role} 
                  onValueChange={(v) => setEditingMember({
                    ...editingMember,
                    role: v as keyof typeof ROLES
                  })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES).map(([key, config]) => (
                      key !== "owner" && (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingMember(null)}
                disabled={updateStaffMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateStaffMutation.isPending}
              >
                {updateStaffMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Access</DialogTitle>
            <DialogDescription>
              This will revoke staff access for this user and change their role to "Client".
              They will still be able to log in as a regular client.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteStaffMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteStaffMutation.mutate(deleteConfirmId)}
              disabled={deleteStaffMutation.isPending}
            >
              {deleteStaffMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Staff Access"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}






