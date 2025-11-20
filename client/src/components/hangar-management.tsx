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
  Home, 
  Plus, 
  Edit3,
  Trash2,
  MapPin,
  Ruler,
  DollarSign,
  Plane,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Package,
  Wifi,
  Zap,
  Shield,
  Wrench,
  Building
} from "lucide-react";

interface HangarSpace {
  id: string;
  name: string;
  location: string;
  size_sqft: number;
  monthly_rate: number;
  status: "available" | "occupied" | "maintenance" | "reserved";
  features: string[];
  current_tenant_id?: string;
  current_aircraft_id?: string;
  lease_start?: string;
  lease_end?: string;
  notes?: string;
  created_at: string;
  current_tenant?: {
    full_name: string;
    email: string;
  };
  current_aircraft?: {
    tail_number: string;
    model: string;
  };
}

interface HangarReservation {
  id: string;
  hangar_id: string;
  user_id: string;
  aircraft_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "confirmed" | "cancelled";
  monthly_rate: number;
  created_at: string;
  hangar?: {
    name: string;
    location: string;
  };
  user?: {
    full_name: string;
    email: string;
  };
  aircraft?: {
    tail_number: string;
  };
}

const HANGAR_FEATURES = [
  { id: "electricity", label: "Electricity", icon: Zap },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "maintenance", label: "Maintenance Area", icon: Wrench },
  { id: "office", label: "Office Space", icon: Building },
  { id: "heated", label: "Heated", icon: Home },
];

export function HangarManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHangar, setEditingHangar] = useState<HangarSpace | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [sizeSqft, setSizeSqft] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Create hangars table if needed
  const ensureTableExists = async () => {
    const { error: checkError } = await supabase
      .from("hangar_spaces")
      .select("id")
      .limit(0);
    
    if (checkError?.code === "42P01") {
      console.log("Creating hangar_spaces table...");
      
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS hangar_spaces (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            size_sqft INTEGER NOT NULL,
            monthly_rate DECIMAL(10,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
            features TEXT[] DEFAULT '{}',
            current_tenant_id UUID REFERENCES auth.users(id),
            current_aircraft_id UUID REFERENCES aircraft(id),
            lease_start DATE,
            lease_end DATE,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT valid_lease_dates CHECK (
              (lease_start IS NULL AND lease_end IS NULL) OR
              (lease_start IS NOT NULL AND lease_end IS NOT NULL AND lease_end >= lease_start)
            ),
            CONSTRAINT tenant_aircraft_consistency CHECK (
              (current_tenant_id IS NULL AND current_aircraft_id IS NULL) OR
              (current_tenant_id IS NOT NULL)
            )
          );
          
          CREATE INDEX idx_hangar_spaces_status ON hangar_spaces(status);
          CREATE INDEX idx_hangar_spaces_location ON hangar_spaces(location);
          
          -- Create reservations table
          CREATE TABLE IF NOT EXISTS hangar_reservations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            hangar_id UUID NOT NULL REFERENCES hangar_spaces(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id),
            aircraft_id UUID NOT NULL REFERENCES aircraft(id),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
            monthly_rate DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT valid_reservation_dates CHECK (end_date >= start_date)
          );
          
          CREATE INDEX idx_hangar_reservations_hangar ON hangar_reservations(hangar_id);
          CREATE INDEX idx_hangar_reservations_user ON hangar_reservations(user_id);
          CREATE INDEX idx_hangar_reservations_status ON hangar_reservations(status);
          
          ALTER TABLE hangar_spaces ENABLE ROW LEVEL SECURITY;
          ALTER TABLE hangar_reservations ENABLE ROW LEVEL SECURITY;
          
          -- RLS Policies for hangar_spaces
          CREATE POLICY "Staff can view all hangars" ON hangar_spaces
            FOR SELECT TO authenticated
            USING (true);
          
          CREATE POLICY "Staff can manage hangars" ON hangar_spaces
            FOR ALL TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'ops')
              )
            );
          
          -- RLS Policies for hangar_reservations
          CREATE POLICY "Staff can view all reservations" ON hangar_reservations
            FOR SELECT TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'ops', 'cfi')
              )
            );
          
          CREATE POLICY "Staff can manage reservations" ON hangar_reservations
            FOR ALL TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role IN ('admin', 'staff', 'founder', 'ops')
              )
            );
          
          -- Update trigger
          CREATE OR REPLACE FUNCTION update_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER update_hangar_spaces_updated_at
          BEFORE UPDATE ON hangar_spaces
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at();
          
          CREATE TRIGGER update_hangar_reservations_updated_at
          BEFORE UPDATE ON hangar_reservations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at();
        `
      }).catch(() => {
        console.warn("Could not create hangar tables automatically");
        return { error: "Table creation failed" };
      });
      
      if (!error) {
        console.log("✓ Created hangar tables");
      }
    }
  };

  // Fetch hangar spaces
  const { data: hangars = [], isLoading } = useQuery({
    queryKey: ["hangar-spaces", statusFilter],
    queryFn: async () => {
      await ensureTableExists();
      
      let query = supabase
        .from("hangar_spaces")
        .select(`
          *,
          current_tenant:current_tenant_id(full_name, email),
          current_aircraft:current_aircraft_id(tail_number, model)
        `)
        .order("name");
      
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.code === "42P01") {
          return [];
        }
        throw error;
      }
      
      return data as HangarSpace[];
    },
  });

  // Fetch reservations
  const { data: reservations = [] } = useQuery({
    queryKey: ["hangar-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hangar_reservations")
        .select(`
          *,
          hangar:hangar_id(name, location),
          user:user_id(full_name, email),
          aircraft:aircraft_id(tail_number)
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        if (error.code === "42P01") {
          return [];
        }
        throw error;
      }
      
      return data as HangarReservation[];
    },
  });

  // Filter hangars based on search
  const filteredHangars = hangars.filter(hangar => {
    const matchesSearch = searchTerm === "" || 
      hangar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hangar.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hangar.current_tenant?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hangar.current_aircraft?.tail_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Group hangars by status
  const hangarsByStatus = {
    available: filteredHangars.filter(h => h.status === "available"),
    occupied: filteredHangars.filter(h => h.status === "occupied"),
    maintenance: filteredHangars.filter(h => h.status === "maintenance"),
    reserved: filteredHangars.filter(h => h.status === "reserved"),
  };

  // Save hangar mutation
  const saveHangarMutation = useMutation({
    mutationFn: async () => {
      const hangarData = {
        name,
        location,
        size_sqft: parseInt(sizeSqft),
        monthly_rate: parseFloat(monthlyRate),
        features: selectedFeatures,
        notes: notes || null,
      };

      if (editingHangar) {
        const { data, error } = await supabase
          .from("hangar_spaces")
          .update(hangarData)
          .eq("id", editingHangar.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("hangar_spaces")
          .insert(hangarData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: editingHangar ? "Hangar updated" : "Hangar created",
        description: "The hangar space has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["hangar-spaces"] });
      setIsCreateDialogOpen(false);
      setEditingHangar(null);
      // Reset form
      setName("");
      setLocation("");
      setSizeSqft("");
      setMonthlyRate("");
      setSelectedFeatures([]);
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error saving hangar",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete hangar mutation
  const deleteHangarMutation = useMutation({
    mutationFn: async (hangarId: string) => {
      const { error } = await supabase
        .from("hangar_spaces")
        .delete()
        .eq("id", hangarId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Hangar deleted",
        description: "The hangar space has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["hangar-spaces"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting hangar",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update hangar status
  const updateHangarStatusMutation = useMutation({
    mutationFn: async ({ hangarId, status }: { hangarId: string; status: string }) => {
      const updateData: any = { status };
      
      // Clear tenant/aircraft info if making available
      if (status === "available") {
        updateData.current_tenant_id = null;
        updateData.current_aircraft_id = null;
        updateData.lease_start = null;
        updateData.lease_end = null;
      }
      
      const { error } = await supabase
        .from("hangar_spaces")
        .update(updateData)
        .eq("id", hangarId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The hangar status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["hangar-spaces"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle edit
  const handleEdit = (hangar: HangarSpace) => {
    setEditingHangar(hangar);
    setName(hangar.name);
    setLocation(hangar.location);
    setSizeSqft(hangar.size_sqft.toString());
    setMonthlyRate(hangar.monthly_rate.toString());
    setSelectedFeatures(hangar.features);
    setNotes(hangar.notes || "");
    setIsCreateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: "Available", variant: "outline" as const, icon: CheckCircle },
      occupied: { label: "Occupied", variant: "secondary" as const, icon: Users },
      maintenance: { label: "Maintenance", variant: "secondary" as const, icon: Wrench },
      reserved: { label: "Reserved", variant: "secondary" as const, icon: Clock },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Hangar Management
                </CardTitle>
                <CardDescription>
                  Manage hangar spaces, availability, and tenant assignments
                </CardDescription>
              </div>
              <Button onClick={() => {
                setEditingHangar(null);
                setIsCreateDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hangar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Hangars</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hangars.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {hangarsByStatus.available.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Occupied
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {hangarsByStatus.occupied.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${hangarsByStatus.occupied.reduce((sum, h) => sum + h.monthly_rate, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search hangars..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hangars Table */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Hangars ({filteredHangars.length})</TabsTrigger>
                <TabsTrigger value="available">Available ({hangarsByStatus.available.length})</TabsTrigger>
                <TabsTrigger value="occupied">Occupied ({hangarsByStatus.occupied.length})</TabsTrigger>
                <TabsTrigger value="reservations">Reservations ({reservations.length})</TabsTrigger>
              </TabsList>

              {/* All Hangars Tab */}
              <TabsContent value="all">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading hangars...</p>
                  </div>
                ) : filteredHangars.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No hangars found. Create your first hangar space.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hangar</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Aircraft</TableHead>
                          <TableHead>Features</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHangars.map((hangar) => (
                          <TableRow key={hangar.id}>
                            <TableCell className="font-medium">{hangar.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {hangar.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Ruler className="h-3 w-3 text-muted-foreground" />
                                {hangar.size_sqft.toLocaleString()} sq ft
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                ${hangar.monthly_rate.toLocaleString()}/mo
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(hangar.status)}</TableCell>
                            <TableCell>
                              {hangar.current_tenant ? (
                                <div className="text-sm">
                                  <p className="font-medium">{hangar.current_tenant.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {hangar.current_tenant.email}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {hangar.current_aircraft ? (
                                <Badge variant="outline" className="font-mono">
                                  {hangar.current_aircraft.tail_number}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {hangar.features.map((feature) => {
                                  const featureConfig = HANGAR_FEATURES.find(f => f.id === feature);
                                  if (!featureConfig) return null;
                                  return (
                                    <Badge key={feature} variant="secondary" className="text-xs">
                                      <featureConfig.icon className="h-3 w-3 mr-1" />
                                      {featureConfig.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(hangar)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                {hangar.status === "available" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteHangarMutation.mutate(hangar.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Available Hangars Tab */}
              <TabsContent value="available">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hangarsByStatus.available.map((hangar) => (
                    <Card key={hangar.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{hangar.name}</span>
                          {getStatusBadge(hangar.status)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {hangar.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">{hangar.size_sqft.toLocaleString()} sq ft</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monthly Rate</p>
                            <p className="font-medium">${hangar.monthly_rate.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {hangar.features.map((feature) => {
                            const featureConfig = HANGAR_FEATURES.find(f => f.id === feature);
                            if (!featureConfig) return null;
                            return (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                <featureConfig.icon className="h-3 w-3 mr-1" />
                                {featureConfig.label}
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="pt-2 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(hangar)}>
                            Edit
                          </Button>
                          <Button size="sm" className="flex-1">
                            Assign Tenant
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Occupied Hangars Tab */}
              <TabsContent value="occupied">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hangar</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Lease Period</TableHead>
                        <TableHead>Monthly Rate</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hangarsByStatus.occupied.map((hangar) => (
                        <TableRow key={hangar.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{hangar.name}</p>
                              <p className="text-sm text-muted-foreground">{hangar.location}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {hangar.current_tenant && (
                              <div>
                                <p className="font-medium">{hangar.current_tenant.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {hangar.current_tenant.email}
                                </p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {hangar.current_aircraft && (
                              <Badge variant="outline" className="font-mono">
                                {hangar.current_aircraft.tail_number}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {hangar.lease_start && hangar.lease_end && (
                              <div className="text-sm">
                                <p>{format(new Date(hangar.lease_start), "MMM d, yyyy")} -</p>
                                <p>{format(new Date(hangar.lease_end), "MMM d, yyyy")}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              ${hangar.monthly_rate.toLocaleString()}/mo
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateHangarStatusMutation.mutate({
                                hangarId: hangar.id,
                                status: "available"
                              })}
                            >
                              End Lease
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Reservations Tab */}
              <TabsContent value="reservations">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hangar</TableHead>
                        <TableHead>Requestor</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reservation.hangar?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {reservation.hangar?.location}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reservation.user?.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {reservation.user?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {reservation.aircraft?.tail_number}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <p>{format(new Date(reservation.start_date), "MMM d, yyyy")} -</p>
                            <p>{format(new Date(reservation.end_date), "MMM d, yyyy")}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              reservation.status === "confirmed" ? "default" :
                              reservation.status === "cancelled" ? "secondary" :
                              "outline"
                            }>
                              {reservation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reservation.status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  Approve
                                </Button>
                                <Button size="sm" variant="ghost">
                                  Decline
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Hangar Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingHangar ? "Edit Hangar" : "Add New Hangar"}
            </DialogTitle>
            <DialogDescription>
              {editingHangar 
                ? "Update the hangar space details."
                : "Create a new hangar space for aircraft storage."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hangar Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hangar A1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., North Row"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size (sq ft) *</Label>
                <Input
                  id="size"
                  type="number"
                  value={sizeSqft}
                  onChange={(e) => setSizeSqft(e.target.value)}
                  placeholder="e.g., 1200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Monthly Rate ($) *</Label>
                <Input
                  id="rate"
                  type="number"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(e.target.value)}
                  placeholder="e.g., 800"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Features & Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {HANGAR_FEATURES.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={feature.id}
                      checked={selectedFeatures.includes(feature.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeatures([...selectedFeatures, feature.id]);
                        } else {
                          setSelectedFeatures(selectedFeatures.filter(f => f !== feature.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={feature.id} className="flex items-center gap-2 cursor-pointer">
                      <feature.icon className="h-4 w-4" />
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingHangar(null);
                // Reset form
                setName("");
                setLocation("");
                setSizeSqft("");
                setMonthlyRate("");
                setSelectedFeatures([]);
                setNotes("");
              }}
              disabled={saveHangarMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveHangarMutation.mutate()}
              disabled={saveHangarMutation.isPending || !name || !location || !sizeSqft || !monthlyRate}
            >
              {editingHangar ? "Update Hangar" : "Create Hangar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}






