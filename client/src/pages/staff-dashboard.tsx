import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, DollarSign, Wrench, Plane } from "lucide-react";
import logoImage from "@assets/freedom-aviation-logo.png";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { KanbanBoard } from "@/components/kanban-board";
import { AircraftTable } from "@/components/aircraft-table";
import { MaintenanceList } from "@/components/maintenance-list";

interface InstructionInvoice {
  id: string;
  owner_id: string;
  aircraft_id: string;
  invoice_number: string;
  amount: number;
  status: string;
  category: string;
  created_by_cfi_id: string;
  created_at: string;
  aircraft?: { tail_number: string };
  owner?: { full_name: string; email: string };
  invoice_lines?: Array<{
    description: string;
    quantity: number;
    unit_cents: number;
  }>;
}

export default function StaffDashboard() {
  const { toast } = useToast();
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [hours, setHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("150");

  // TODO: remove mock functionality
  const reservations = [
    { id: "1", date: "2024-10-15 10:00", student: "John Doe", aircraft: "N847SR", type: "IPC" },
    { id: "2", date: "2024-10-16 14:00", student: "Jane Smith", aircraft: "N123JA", type: "BFR" },
  ];

  const flightLogs = [
    { id: "1", date: "2024-10-14", student: "Mike Johnson", aircraft: "N456AB", hobbsStart: 1200, hobbsEnd: 1202.5, notes: "Pattern work, 5 landings" },
  ];

  // Fetch owners
  const { data: owners = [] } = useQuery({
    queryKey: ['/api/owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('role', 'owner')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch aircraft
  const { data: aircraft = [] } = useQuery({
    queryKey: ['/api/aircraft'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aircraft')
        .select('id, tail_number, owner_id')
        .order('tail_number');
      if (error) throw error;
      return data;
    },
  });

  // Fetch instruction invoices for current CFI
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<InstructionInvoice[]>({
    queryKey: ['/api/cfi/invoices'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          aircraft:aircraft_id(tail_number),
          owner:owner_id(full_name, email),
          invoice_lines(description, quantity, unit_cents)
        `)
        .eq('category', 'instruction')
        .eq('created_by_cfi_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InstructionInvoice[];
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rateCents = Math.round(parseFloat(ratePerHour) * 100);
      const hoursDecimal = parseFloat(hours);

      const { data, error } = await supabase.rpc('create_instruction_invoice', {
        p_owner_id: selectedOwnerId,
        p_aircraft_id: selectedAircraftId,
        p_description: `${description} - ${flightDate}`,
        p_hours: hoursDecimal,
        p_rate_cents: rateCents,
        p_cfi_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfi/invoices'] });
      toast({
        title: "Invoice created",
        description: "Instruction invoice has been created successfully.",
      });
      // Reset form
      setSelectedOwnerId("");
      setSelectedAircraftId("");
      setDescription("");
      setFlightDate("");
      setHours("");
      setRatePerHour("150");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Finalize invoice mutation
  const finalizeInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase.rpc('finalize_invoice', {
        p_invoice_id: invoiceId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfi/invoices'] });
      toast({
        title: "Invoice finalized",
        description: "Invoice has been marked as finalized.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId || !selectedAircraftId || !description || !flightDate || !hours || !ratePerHour) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createInvoiceMutation.mutate();
  };

  const filteredAircraft = selectedOwnerId
    ? aircraft.filter((a: any) => a.owner_id === selectedOwnerId)
    : aircraft;

  const totalAmount = hours && ratePerHour
    ? (parseFloat(hours) * parseFloat(ratePerHour)).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Freedom Aviation" className="h-8 w-auto" />
            <h1 className="text-xl font-semibold">Freedom Aviation - Staff</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-8">
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" data-testid="tab-requests">Service Requests</TabsTrigger>
            <TabsTrigger value="aircraft" data-testid="tab-aircraft">Aircraft</TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">CFI Schedule</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Flight Logs</TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Service Requests (Admin) */}
          <TabsContent value="requests" className="space-y-4">
            <h2 className="text-2xl font-semibold">Service Requests</h2>
            <KanbanBoard />
          </TabsContent>

          {/* Aircraft (Admin) */}
          <TabsContent value="aircraft" className="space-y-4">
            <AircraftTable />
          </TabsContent>

          {/* Maintenance (Admin) */}
          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceList />
          </TabsContent>

          {/* CFI Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Schedule</h2>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <Card key={reservation.id} data-testid={`reservation-${reservation.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{reservation.student}</p>
                        <p className="text-sm text-muted-foreground">{reservation.date}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="font-mono">{reservation.aircraft}</Badge>
                          <Badge variant="secondary">{reservation.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Flight Logs */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Flight Logs</h2>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-3">
              {flightLogs.map((log) => (
                <Card key={log.id} data-testid={`log-${log.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{log.student}</CardTitle>
                        <p className="text-sm text-muted-foreground">{log.date}</p>
                      </div>
                      <Badge variant="outline" className="font-mono">{log.aircraft}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Hobbs Start</p>
                        <p className="font-mono font-semibold">{log.hobbsStart}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hobbs End</p>
                        <p className="font-mono font-semibold">{log.hobbsEnd}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{log.notes}</p>
                    <Button size="sm" data-testid={`button-sign-${log.id}`}>Sign Off</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Flight Instruction Invoices</h2>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Create Invoice Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Instruction Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner">Client *</Label>
                      <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                        <SelectTrigger id="owner" data-testid="select-owner">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners.map((owner: any) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.full_name || owner.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aircraft">Aircraft *</Label>
                      <Select 
                        value={selectedAircraftId} 
                        onValueChange={setSelectedAircraftId}
                        disabled={!selectedOwnerId}
                      >
                        <SelectTrigger id="aircraft" data-testid="select-aircraft">
                          <SelectValue placeholder="Select aircraft" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredAircraft.map((ac: any) => (
                            <SelectItem key={ac.id} value={ac.id}>
                              {ac.tail_number}
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
                        placeholder="e.g., IPC training, BFR, Flight instruction"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flight-date">Flight Date *</Label>
                      <Input
                        id="flight-date"
                        data-testid="input-flight-date"
                        type="date"
                        value={flightDate}
                        onChange={(e) => setFlightDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hours">Instruction Hours *</Label>
                      <Input
                        id="hours"
                        data-testid="input-hours"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g., 2.5"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
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
                      data-testid="button-create-invoice"
                      disabled={createInvoiceMutation.isPending}
                    >
                      {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Invoice List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">My Instruction Invoices</h3>
              
              {isLoadingInvoices ? (
                <p className="text-muted-foreground">Loading invoices...</p>
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground">No instruction invoices yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    const lineItem = invoice.invoice_lines?.[0];
                    const calculatedTotal = lineItem 
                      ? (lineItem.quantity * lineItem.unit_cents / 100).toFixed(2)
                      : invoice.amount.toFixed(2);
                    
                    return (
                      <Card key={invoice.id} data-testid={`invoice-${invoice.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {invoice.aircraft?.tail_number || 'N/A'}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {invoice.owner?.full_name || invoice.owner?.email || 'Unknown Client'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={invoice.status === 'finalized' ? 'default' : 'secondary'}
                                data-testid={`badge-status-${invoice.id}`}
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Invoice #</p>
                              <p className="font-mono">{invoice.invoice_number}</p>
                            </div>
                            
                            {lineItem && (
                              <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p>{lineItem.description}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {lineItem.quantity} hrs × ${(lineItem.unit_cents / 100).toFixed(2)}/hr
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-xl font-bold">${calculatedTotal}</p>
                              </div>
                              
                              {invoice.status === 'draft' && (
                                <Button
                                  size="sm"
                                  data-testid={`button-finalize-${invoice.id}`}
                                  onClick={() => finalizeInvoiceMutation.mutate(invoice.id)}
                                  disabled={finalizeInvoiceMutation.isPending}
                                >
                                  {finalizeInvoiceMutation.isPending ? "Finalizing..." : "Mark as Finalized"}
                                </Button>
                              )}
                              
                              {invoice.status === 'finalized' && (
                                <p className="text-sm text-muted-foreground">
                                  Finalized on {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
