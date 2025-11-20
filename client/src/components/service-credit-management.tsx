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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Coins, 
  Plus, 
  Minus,
  History,
  UserCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";

interface ServiceCredit {
  id: string;
  owner_id: string;
  amount: number;
  used: number;
  remaining: number;
  expires_at?: string;
  created_at: string;
  notes?: string;
  owner?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface CreditTransaction {
  id: string;
  owner_id: string;
  credit_id?: string;
  type: "credit" | "debit" | "adjustment";
  amount: number;
  description: string;
  created_by: string;
  created_at: string;
  owner?: {
    full_name: string;
    email: string;
  };
}

export function ServiceCreditManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeductDialogOpen, setIsDeductDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  
  // Form state for adding credits
  const [creditAmount, setCreditAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  
  // Form state for deducting credits
  const [selectedCredit, setSelectedCredit] = useState<ServiceCredit | null>(null);
  const [deductAmount, setDeductAmount] = useState("");
  const [deductDescription, setDeductDescription] = useState("");

  // Check if tables exist and create if needed
  const ensureTablesExist = async () => {
    const { error: creditCheckError } = await supabase
      .from("service_credits")
      .select("id")
      .limit(0);
    
    if (creditCheckError?.code === "42P01") {
      console.log("Creating service_credits tables...");
      
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          -- Create service_credits table
          CREATE TABLE IF NOT EXISTS service_credits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES user_profiles(id),
            amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            used DECIMAL(10,2) NOT NULL DEFAULT 0,
            remaining DECIMAL(10,2) GENERATED ALWAYS AS (amount - used) STORED,
            expires_at DATE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID NOT NULL REFERENCES auth.users(id),
            notes TEXT
          );
          
          -- Create credit_transactions table for audit trail
          CREATE TABLE IF NOT EXISTS credit_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES user_profiles(id),
            credit_id UUID REFERENCES service_credits(id),
            type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'adjustment')),
            amount DECIMAL(10,2) NOT NULL,
            description TEXT NOT NULL,
            created_by UUID NOT NULL REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- Add indexes
          CREATE INDEX idx_service_credits_owner_id ON service_credits(owner_id);
          CREATE INDEX idx_credit_transactions_owner_id ON credit_transactions(owner_id);
          CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
          
          -- Enable RLS
          ALTER TABLE service_credits ENABLE ROW LEVEL SECURITY;
          ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
          
          -- Policies for service_credits
          CREATE POLICY "Staff can view all credits" ON service_credits
            FOR SELECT TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'cfi', 'ops')
              )
            );
          
          CREATE POLICY "Staff can create credits" ON service_credits
            FOR INSERT TO authenticated
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'ops')
              )
              AND created_by = auth.uid()
            );
          
          CREATE POLICY "Staff can update credits" ON service_credits
            FOR UPDATE TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'ops')
              )
            );
          
          -- Policies for credit_transactions
          CREATE POLICY "Staff can view all transactions" ON credit_transactions
            FOR SELECT TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'cfi', 'ops')
              )
            );
          
          CREATE POLICY "Staff can create transactions" ON credit_transactions
            FOR INSERT TO authenticated
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'ops')
              )
              AND created_by = auth.uid()
            );
        `
      }).catch(() => {
        console.warn("Could not create service credit tables automatically");
        return { error: "Table creation failed" };
      });
      
      if (!error) {
        console.log("✓ Created service credit tables");
      }
    }
  };

  // Fetch owners for dropdown
  const { data: owners = [] } = useQuery({
    queryKey: ["owners-for-credits"],
    queryFn: async () => {
      await ensureTablesExist();
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .eq("role", "owner")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch service credits
  const { data: serviceCredits = [], isLoading: isLoadingCredits } = useQuery({
    queryKey: ["service-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_credits")
        .select(`
          *,
          owner:owner_id(id, full_name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        if (error.code === "42P01") {
          // Table doesn't exist yet
          return [];
        }
        throw error;
      }
      
      return data as ServiceCredit[];
    },
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["credit-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select(`
          *,
          owner:owner_id(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) {
        if (error.code === "42P01") {
          // Table doesn't exist yet
          return [];
        }
        throw error;
      }
      
      return data as CreditTransaction[];
    },
  });

  // Calculate statistics
  const stats = serviceCredits.reduce((acc, credit) => {
    acc.totalCredits += credit.amount;
    acc.totalUsed += credit.used;
    acc.totalRemaining += credit.remaining;
    acc.activeClients += credit.remaining > 0 ? 1 : 0;
    return acc;
  }, {
    totalCredits: 0,
    totalUsed: 0,
    totalRemaining: 0,
    activeClients: 0,
  });

  // Add credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOwner || !creditAmount) {
        throw new Error("Please fill in all required fields");
      }

      const amount = parseFloat(creditAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      // Create or update service credit
      const { data: existingCredit } = await supabase
        .from("service_credits")
        .select("*")
        .eq("owner_id", selectedOwner)
        .maybeSingle();

      let creditId: string;
      
      if (existingCredit) {
        // Update existing credit
        const { data, error } = await supabase
          .from("service_credits")
          .update({
            amount: existingCredit.amount + amount,
            expires_at: expiresAt || existingCredit.expires_at,
            notes: notes || existingCredit.notes,
          })
          .eq("id", existingCredit.id)
          .select()
          .single();
        
        if (error) throw error;
        creditId = data.id;
      } else {
        // Create new credit
        const { data, error } = await supabase
          .from("service_credits")
          .insert({
            owner_id: selectedOwner,
            amount,
            used: 0,
            expires_at: expiresAt || null,
            notes: notes || null,
            created_by: user?.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        creditId = data.id;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          owner_id: selectedOwner,
          credit_id: creditId,
          type: "credit",
          amount,
          description: `Added ${amount} credits${notes ? `: ${notes}` : ""}`,
          created_by: user?.id,
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      toast({
        title: "Credits added",
        description: "Service credits have been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["service-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      setIsAddDialogOpen(false);
      // Reset form
      setSelectedOwner("");
      setCreditAmount("");
      setExpiresAt("");
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error adding credits",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Deduct credits mutation
  const deductCreditsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCredit || !deductAmount || !deductDescription) {
        throw new Error("Please fill in all required fields");
      }

      const amount = parseFloat(deductAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (amount > selectedCredit.remaining) {
        throw new Error("Insufficient credits available");
      }

      // Update credit balance
      const { error } = await supabase
        .from("service_credits")
        .update({
          used: selectedCredit.used + amount,
        })
        .eq("id", selectedCredit.id);

      if (error) throw error;

      // Record transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          owner_id: selectedCredit.owner_id,
          credit_id: selectedCredit.id,
          type: "debit",
          amount,
          description: deductDescription,
          created_by: user?.id,
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      toast({
        title: "Credits deducted",
        description: "Service credits have been deducted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["service-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      setIsDeductDialogOpen(false);
      // Reset form
      setSelectedCredit(null);
      setDeductAmount("");
      setDeductDescription("");
    },
    onError: (error) => {
      toast({
        title: "Error deducting credits",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Service Credit Management
                </CardTitle>
                <CardDescription>
                  Manage client service credits and track usage
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Credits
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalCredits)}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all clients
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalUsed)}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Consumed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRemaining)}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Remaining
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeClients}</div>
                  <p className="text-xs text-muted-foreground">
                    With credits
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="balances" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="balances">Credit Balances</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>

              {/* Credit Balances Tab */}
              <TabsContent value="balances" className="space-y-4">
                {isLoadingCredits ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading credit balances...</p>
                  </div>
                ) : serviceCredits.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No service credits have been assigned yet.
                      </p>
                      <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                        Add First Credit
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Total Credits</TableHead>
                          <TableHead>Used</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceCredits.map((credit) => (
                          <TableRow key={credit.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{credit.owner?.full_name || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground">{credit.owner?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(credit.amount)}</TableCell>
                            <TableCell>{formatCurrency(credit.used)}</TableCell>
                            <TableCell>
                              <span className={credit.remaining > 0 ? "font-medium text-green-600" : "text-muted-foreground"}>
                                {formatCurrency(credit.remaining)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {credit.expires_at ? (
                                <Badge variant={new Date(credit.expires_at) < new Date() ? "destructive" : "secondary"}>
                                  {format(new Date(credit.expires_at), "MMM d, yyyy")}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">No expiry</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCredit(credit);
                                  setIsDeductDialogOpen(true);
                                }}
                                disabled={credit.remaining <= 0}
                              >
                                <Minus className="h-4 w-4 mr-1" />
                                Use
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Transaction History Tab */}
              <TabsContent value="history" className="space-y-4">
                {isLoadingTransactions ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading transaction history...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No credit transactions yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(new Date(transaction.created_at), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>{transaction.owner?.full_name || "Unknown"}</TableCell>
                            <TableCell>
                              <Badge variant={transaction.type === "credit" ? "default" : "secondary"}>
                                {transaction.type === "credit" ? (
                                  <Plus className="h-3 w-3 mr-1" />
                                ) : (
                                  <Minus className="h-3 w-3 mr-1" />
                                )}
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={transaction.type === "credit" ? "text-green-600" : "text-red-600"}>
                              {transaction.type === "credit" ? "+" : "-"}{formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {transaction.description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Credits Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service Credits</DialogTitle>
            <DialogDescription>
              Add service credits to a client's account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Client *</Label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.full_name} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Credit Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expiry Date (Optional)</Label>
              <Input
                id="expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about these credits"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={addCreditsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addCreditsMutation.mutate()}
              disabled={addCreditsMutation.isPending}
            >
              Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deduct Credits Dialog */}
      <Dialog open={isDeductDialogOpen} onOpenChange={setIsDeductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Service Credits</DialogTitle>
            <DialogDescription>
              Deduct credits from {selectedCredit?.owner?.full_name}'s account.
            </DialogDescription>
          </DialogHeader>
          {selectedCredit && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Credits:</span>
                  <span className="font-medium">{formatCurrency(selectedCredit.remaining)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductAmount">Amount to Use ($) *</Label>
                <Input
                  id="deductAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedCredit.remaining}
                  value={deductAmount}
                  onChange={(e) => setDeductAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={deductDescription}
                  onChange={(e) => setDeductDescription(e.target.value)}
                  placeholder="What service were these credits used for?"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeductDialogOpen(false)}
              disabled={deductCreditsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deductCreditsMutation.mutate()}
              disabled={deductCreditsMutation.isPending}
            >
              Use Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}





