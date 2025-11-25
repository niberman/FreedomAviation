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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Fuel, 
  Plus, 
  DollarSign,
  TrendingUp,
  Calendar,
  Plane,
  BarChart3
} from "lucide-react";

interface FuelRecord {
  id: string;
  aircraft_id: string;
  date: string;
  gallons: number;
  price_per_gallon: number;
  total_cost: number;
  fuel_type: "100LL" | "Jet-A" | "Jet-A+" | "MOGAS";
  vendor?: string;
  invoice_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  aircraft?: {
    tail_number: string;
  };
}

interface FuelStats {
  totalGallons: number;
  totalCost: number;
  avgPricePerGallon: number;
  recordCount: number;
}

export function FuelTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("month");
  
  // Form state
  const [selectedAircraftId, setSelectedAircraftId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [gallons, setGallons] = useState("");
  const [pricePerGallon, setPricePerGallon] = useState("");
  const [fuelType, setFuelType] = useState<FuelRecord["fuel_type"]>("100LL");
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedTimeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  // Fetch aircraft for dropdown
  const { data: aircraft = [] } = useQuery({
    queryKey: ["aircraft-for-fuel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, tail_number")
        .order("tail_number");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch fuel records
  const { data: fuelRecords = [], isLoading } = useQuery({
    queryKey: ["fuel-records", selectedTimeRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from("fuel_records")
        .select("id")
        .limit(0);
      
      if (tableCheckError) {
        console.warn("fuel_records table not found, creating...");
        
        // Create the table
        const { error: createError } = await supabase.rpc("exec_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS fuel_records (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              aircraft_id UUID NOT NULL REFERENCES aircraft(id),
              date DATE NOT NULL,
              gallons DECIMAL(10,2) NOT NULL CHECK (gallons > 0),
              price_per_gallon DECIMAL(10,2) NOT NULL CHECK (price_per_gallon > 0),
              total_cost DECIMAL(10,2) NOT NULL,
              fuel_type TEXT NOT NULL CHECK (fuel_type IN ('100LL', 'Jet-A', 'Jet-A+', 'MOGAS')),
              vendor TEXT,
              invoice_number TEXT,
              notes TEXT,
              created_by UUID NOT NULL REFERENCES auth.users(id),
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Add RLS
            ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
            
            -- Staff can view all records
            CREATE POLICY "Staff can view all fuel records" ON fuel_records
              FOR SELECT TO authenticated
              USING (
                EXISTS (
                  SELECT 1 FROM user_profiles
                  WHERE user_profiles.id = auth.uid()
                  AND user_profiles.role IN ('admin', 'staff', 'founder', 'cfi', 'ops')
                )
              );
            
            -- Staff can insert records
            CREATE POLICY "Staff can insert fuel records" ON fuel_records
              FOR INSERT TO authenticated
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM user_profiles
                  WHERE user_profiles.id = auth.uid()
                  AND user_profiles.role IN ('admin', 'staff', 'founder', 'cfi', 'ops')
                )
                AND created_by = auth.uid()
              );
            
            -- Staff can update their own records
            CREATE POLICY "Staff can update own fuel records" ON fuel_records
              FOR UPDATE TO authenticated
              USING (created_by = auth.uid())
              WITH CHECK (created_by = auth.uid());
          `
        }).catch(() => {
          // If exec_sql doesn't exist, just return empty array
          console.warn("Could not create fuel_records table automatically");
          return { error: "Table creation failed" };
        });
        
        if (!createError) {
          console.log("✓ Created fuel_records table");
        }
        
        return [];
      }
      
      const { data, error } = await supabase
        .from("fuel_records")
        .select(`
          *,
          aircraft:aircraft_id(tail_number)
        `)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data as FuelRecord[];
    },
  });

  // Calculate statistics
  const stats: FuelStats = fuelRecords.reduce((acc, record) => {
    return {
      totalGallons: acc.totalGallons + record.gallons,
      totalCost: acc.totalCost + record.total_cost,
      avgPricePerGallon: 0, // Calculate after
      recordCount: acc.recordCount + 1,
    };
  }, {
    totalGallons: 0,
    totalCost: 0,
    avgPricePerGallon: 0,
    recordCount: 0,
  });
  
  if (stats.totalGallons > 0) {
    stats.avgPricePerGallon = stats.totalCost / stats.totalGallons;
  }

  // Group records by aircraft for summary
  const aircraftSummary = fuelRecords.reduce((acc, record) => {
    const tailNumber = record.aircraft?.tail_number || "Unknown";
    if (!acc[tailNumber]) {
      acc[tailNumber] = {
        gallons: 0,
        cost: 0,
        count: 0,
      };
    }
    acc[tailNumber].gallons += record.gallons;
    acc[tailNumber].cost += record.total_cost;
    acc[tailNumber].count += 1;
    return acc;
  }, {} as Record<string, { gallons: number; cost: number; count: number }>);

  // Create fuel record mutation
  const createFuelRecordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAircraftId || !gallons || !pricePerGallon || !date) {
        throw new Error("Please fill in all required fields");
      }

      const gallonsNum = parseFloat(gallons);
      const priceNum = parseFloat(pricePerGallon);
      const totalCost = gallonsNum * priceNum;

      const { data, error } = await supabase
        .from("fuel_records")
        .insert({
          aircraft_id: selectedAircraftId,
          date,
          gallons: gallonsNum,
          price_per_gallon: priceNum,
          total_cost: totalCost,
          fuel_type: fuelType,
          vendor: vendor || null,
          invoice_number: invoiceNumber || null,
          notes: notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Fuel record created",
        description: "The fuel purchase has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["fuel-records"] });
      setIsAddDialogOpen(false);
      // Reset form
      setSelectedAircraftId("");
      setDate(new Date().toISOString().split('T')[0]);
      setGallons("");
      setPricePerGallon("");
      setFuelType("100LL");
      setVendor("");
      setInvoiceNumber("");
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error creating fuel record",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
                  <Fuel className="h-5 w-5" />
                  Fuel Management
                </CardTitle>
                <CardDescription>
                  Track fuel purchases and monitor costs across the fleet
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Fuel Purchase
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Time Range Selector */}
            <div className="mb-6">
              <Tabs value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="quarter">Quarter</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Gallons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGallons.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.recordCount} purchases
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
                  <p className="text-xs text-muted-foreground">
                    All fuel types
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Avg Price/Gallon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.avgPricePerGallon)}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all purchases
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Aircraft Fueled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(aircraftSummary).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Unique aircraft
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Aircraft Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Fuel by Aircraft</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(aircraftSummary).map(([tailNumber, summary]) => (
                  <Card key={tailNumber}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Plane className="h-4 w-4" />
                          {tailNumber}
                        </span>
                        <Badge variant="secondary">{summary.count}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gallons:</span>
                        <span className="font-medium">{summary.gallons.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium">{formatCurrency(summary.cost)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Records Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Fuel Purchases</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading fuel records...</p>
                </div>
              ) : fuelRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No fuel records found for this time period.
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                      Record First Purchase
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Gallons</TableHead>
                        <TableHead>Price/Gal</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Vendor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(new Date(record.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.aircraft?.tail_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.fuel_type}</Badge>
                          </TableCell>
                          <TableCell>{record.gallons.toFixed(1)}</TableCell>
                          <TableCell>{formatCurrency(record.price_per_gallon)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(record.total_cost)}
                          </TableCell>
                          <TableCell>{record.vendor || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Fuel Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Fuel Purchase</DialogTitle>
            <DialogDescription>
              Add a new fuel purchase record for an aircraft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aircraft *</Label>
                <Select value={selectedAircraftId} onValueChange={setSelectedAircraftId}>
                  <SelectTrigger id="aircraft">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraft.map((ac) => (
                      <SelectItem key={ac.id} value={ac.id}>
                        {ac.tail_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gallons">Gallons *</Label>
                <Input
                  id="gallons"
                  type="number"
                  step="0.1"
                  min="0"
                  value={gallons}
                  onChange={(e) => setGallons(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerGallon">Price/Gallon *</Label>
                <Input
                  id="pricePerGallon"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePerGallon}
                  onChange={(e) => setPricePerGallon(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input
                  value={
                    gallons && pricePerGallon
                      ? formatCurrency(parseFloat(gallons) * parseFloat(pricePerGallon))
                      : "$0.00"
                  }
                  disabled
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type *</Label>
                <Select value={fuelType} onValueChange={(v) => setFuelType(v as FuelRecord["fuel_type"])}>
                  <SelectTrigger id="fuelType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100LL">100LL</SelectItem>
                    <SelectItem value="Jet-A">Jet-A</SelectItem>
                    <SelectItem value="Jet-A+">Jet-A+</SelectItem>
                    <SelectItem value="MOGAS">MOGAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g., Signature Flight Support"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={createFuelRecordMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createFuelRecordMutation.mutate()}
              disabled={createFuelRecordMutation.isPending}
            >
              Record Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}






