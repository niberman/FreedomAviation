import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, FileText, DollarSign, Wrench, Plane } from "lucide-react";
import logoImage from "@assets/falogo.png";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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
import { ClientsTable } from "@/components/clients-table";

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
  due_date?: string | null;
  paid_date?: string | null;
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [hours, setHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("150");
  const [showPreview, setShowPreview] = useState(false);


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

  // Fetch aircraft for invoice dropdown
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

  // Fetch aircraft with full details for the AircraftTable
  const { data: aircraftFull = [], isLoading: isLoadingAircraft, error: aircraftError } = useQuery({
    queryKey: ['/api/aircraft/full'],
    queryFn: async () => {
      console.log('🔍 Fetching aircraft for staff dashboard...');
      
      // Try nested query first
      let query = supabase
        .from('aircraft')
        .select(`
          id,
          tail_number,
          make,
          model,
          class,
          base_location,
          owner_id,
          owner:owner_id(full_name, email)
        `)
        .order('tail_number');

      let { data, error } = await query;
      
      // If nested query fails, fetch separately
      if (error) {
        console.warn('⚠️ Nested query failed, trying separate queries:', error?.message);
        
        // Fetch aircraft without nested relations
        const aircraftResult = await supabase
          .from('aircraft')
          .select('id, tail_number, make, model, class, base_location, owner_id')
          .order('tail_number');
        
        if (aircraftResult.error) {
          console.error('❌ Error fetching aircraft:', aircraftResult.error);
          throw aircraftResult.error;
        }
        
        const aircraftData = aircraftResult.data || [];
        
        // Get unique owner IDs
        const ownerIds = [...new Set(aircraftData.map((ac: any) => ac.owner_id).filter(Boolean))];
        
        // Fetch owners separately
        let ownersMap: Record<string, { full_name?: string; email?: string }> = {};
        if (ownerIds.length > 0) {
          const ownersResult = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .in('id', ownerIds);
          
          if (ownersResult.data) {
            ownersMap = ownersResult.data.reduce((acc: any, owner: any) => {
              acc[owner.id] = { full_name: owner.full_name, email: owner.email };
              return acc;
            }, {});
          }
        }
        
        // Combine data
        data = aircraftData.map((ac: any) => ({
          ...ac,
          owner: ownersMap[ac.owner_id] || null,
        }));
        
        error = null; // Clear error since we successfully fetched
      }
      
      if (error) {
        console.error('❌ Error fetching aircraft:', error);
        throw error;
      }
      
      console.log('✅ Fetched aircraft:', data?.length || 0, 'aircraft');
      
      // Transform to match AircraftTable interface
      return (data || []).map((ac: any) => ({
        id: ac.id,
        tailNumber: ac.tail_number,
        make: ac.make || 'Unknown',
        model: ac.model || '',
        class: ac.class || 'Unknown',
        baseAirport: ac.base_location || 'KAPA', // Use base_location from DB or default to KAPA
        owner: ac.owner?.full_name || ac.owner?.email || 'Unknown Owner',
      }));
    },
  });

  // Handle aircraft loading errors
  useEffect(() => {
    if (aircraftError) {
      console.error('Aircraft query error:', aircraftError);
      toast({
        title: 'Error loading aircraft',
        description: aircraftError instanceof Error ? aircraftError.message : 'Failed to load aircraft. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [aircraftError, toast]);

  // Fetch service requests for kanban board
  const { data: serviceRequests = [], refetch: refetchServiceRequests } = useQuery({
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          service_type,
          requested_for,
          requested_date,
          requested_time,
          description,
          notes,
          status,
          priority,
          created_at,
          aircraft:aircraft_id(tail_number),
          owner:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    // Refetch every 30 seconds to catch new requests
    refetchInterval: 30000,
  });

  // Fetch maintenance items
  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          id,
          item_name,
          due_date,
          due_hobbs,
          status,
          aircraft:aircraft_id(tail_number, hobbs_hours)
        `)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const isDev = !import.meta.env.PROD;

  // Check if user is admin
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    retry: false,
  });

  const isAdmin = userProfile?.role === 'admin';

  // Fetch instruction invoices for current CFI
  const { data: invoices = [], isLoading: isLoadingInvoices, refetch: refetchInvoices, error: invoicesError } = useQuery<InstructionInvoice[]>({
    queryKey: ['/api/cfi/invoices', user?.id, isDev, isAdmin],
    queryFn: async () => {
      console.log('🔍 Fetching invoices - User:', user?.id, 'isAdmin:', isAdmin, 'isDev:', isDev);
      
      // In dev mode without user, return empty array (RLS will block anyway)
      // User should log in to see invoices
      if (!user && isDev) {
        console.warn('⚠️ DEV MODE: No authenticated user. Please log in to view invoices.');
        return [];
      }

      // In production, require authentication
      if (!user) {
        console.error('❌ Not authenticated');
        throw new Error('Not authenticated. Please log in to view invoices.');
      }

      // Build the query - try nested query first
      let query = supabase
        .from('invoices')
        .select(`
          *,
          aircraft:aircraft_id(tail_number),
          owner:owner_id(full_name, email),
          invoice_lines(description, quantity, unit_cents)
        `)
        .eq('category', 'instruction');

      // Admins see all invoices, CFIs see only their own
      if (!isAdmin) {
        console.log('🔍 Filtering by CFI ID:', user.id);
        query = query.eq('created_by_cfi_id', user.id);
      } else {
        console.log('🔍 Showing all invoices (admin mode)');
      }

      let { data, error } = await query.order('created_at', { ascending: false });
      
      // If nested query fails, try fetching separately
      if (error && (error.message?.includes('invoice_lines') || error.message?.includes('aircraft') || error.message?.includes('owner'))) {
        console.warn('⚠️ Nested query failed, trying separate queries:', error.message);
        
        // Build base query without nested relations
        let baseQuery = supabase
          .from('invoices')
          .select('*')
          .eq('category', 'instruction');

        if (!isAdmin) {
          baseQuery = baseQuery.eq('created_by_cfi_id', user.id);
        }

        const invoicesResult = await baseQuery.order('created_at', { ascending: false });
        
        if (invoicesResult.error) {
          error = invoicesResult.error;
          data = null;
        } else {
          const invoiceData = invoicesResult.data || [];
          const invoiceIds = invoiceData.map((inv: any) => inv.id);
          const aircraftIds = [...new Set(invoiceData.map((inv: any) => inv.aircraft_id))];
          const ownerIds = [...new Set(invoiceData.map((inv: any) => inv.owner_id))];
          
          // Fetch related data separately
          const [linesResult, aircraftResult, ownerResult] = await Promise.all([
            invoiceIds.length > 0 
              ? supabase
                  .from('invoice_lines')
                  .select('id, invoice_id, description, quantity, unit_cents')
                  .in('invoice_id', invoiceIds)
              : { data: [], error: null },
            aircraftIds.length > 0
              ? supabase
                  .from('aircraft')
                  .select('id, tail_number')
                  .in('id', aircraftIds)
              : { data: [], error: null },
            ownerIds.length > 0
              ? supabase
                  .from('user_profiles')
                  .select('id, full_name, email')
                  .in('id', ownerIds)
              : { data: [], error: null },
          ]);
          
          // Combine data
          const linesByInvoiceId = (linesResult.data || []).reduce((acc: any, line: any) => {
            if (!acc[line.invoice_id]) {
              acc[line.invoice_id] = [];
            }
            acc[line.invoice_id].push({
              description: line.description,
              quantity: Number(line.quantity),
              unit_cents: Number(line.unit_cents),
            });
            return acc;
          }, {});
          
          const aircraftById = (aircraftResult.data || []).reduce((acc: any, ac: any) => {
            acc[ac.id] = { tail_number: ac.tail_number };
            return acc;
          }, {});
          
          const ownerById = (ownerResult.data || []).reduce((acc: any, owner: any) => {
            acc[owner.id] = { full_name: owner.full_name, email: owner.email };
            return acc;
          }, {});
          
          // Combine everything
          data = invoiceData.map((invoice: any) => ({
            ...invoice,
            invoice_lines: linesByInvoiceId[invoice.id] || [],
            aircraft: aircraftById[invoice.aircraft_id] || null,
            owner: ownerById[invoice.owner_id] || null,
          }));
          
          error = null; // Clear error since we successfully fetched
        }
      }
      
      if (error) {
        console.error('❌ Error fetching invoices:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Check for authentication/RLS errors
        if (error.message?.includes('JWT') || error.message?.includes('authentication') || error.code === 'PGRST301') {
          throw new Error('Authentication required. Please log in to view invoices.');
        }
        
        if (error.code === 'PGRST116') {
          throw new Error('No invoices found. This might be a permissions issue.');
        }
        
        throw new Error(error.message || 'Failed to load invoices. Please try again.');
      }
      
      console.log('✅ Fetched invoices:', data?.length || 0, 'invoices');
      console.log('📋 Invoice data:', data);
      
      // Also log what we're returning
      if (data && data.length > 0) {
        console.log('📄 First invoice sample:', data[0]);
      }
      
      return (data || []) as InstructionInvoice[];
    },
    // Only enable query if user exists (or in dev mode, but we'll handle that in the function)
    enabled: Boolean(user?.id),
    retry: false, // Don't retry on auth errors
  });

  // Handle invoice loading errors with toast
  useEffect(() => {
    if (invoicesError) {
      console.error('Invoice query error:', invoicesError);
      toast({
        title: 'Error loading invoices',
        description: invoicesError instanceof Error ? invoicesError.message : 'Failed to load invoices. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [invoicesError, toast]);

  // Create invoice and send to client mutation
  const createAndSendInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rateCents = Math.round(parseFloat(ratePerHour) * 100);
      const hoursDecimal = parseFloat(hours);

      // Create the invoice
      const { data: invoiceData, error: createError } = await supabase.rpc('create_instruction_invoice', {
        p_owner_id: selectedOwnerId,
        p_aircraft_id: selectedAircraftId,
        p_description: `${description} - ${flightDate}`,
        p_hours: hoursDecimal,
        p_rate_cents: rateCents,
        p_cfi_id: user.id,
      });

      if (createError) throw createError;
      if (!invoiceData) throw new Error('Invoice creation failed');

      const invoiceId = invoiceData;

      // Finalize the invoice
      const { error: finalizeError } = await supabase.rpc('finalize_invoice', {
        p_invoice_id: invoiceId,
      });
      if (finalizeError) throw finalizeError;

      // Send email to client
      try {
        // Always use www domain in production to avoid CORS issues from redirects
        // Vercel redirects non-www to www, which breaks CORS during redirect
        let apiUrl: string;
        if (window.location.hostname === "freedomaviationco.com") {
          // If on non-www, explicitly use www to avoid redirect CORS issues
          apiUrl = "https://www.freedomaviationco.com/api/invoices/send-email";
        } else {
          // Use current origin (localhost, www, or other)
          apiUrl = `${window.location.origin}/api/invoices/send-email`;
        }
        const emailResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ invoiceId }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          let error: any;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: errorText || "Unknown error" };
          }
          
          console.error("❌ Failed to send invoice email:");
          console.error("❌ Response status:", emailResponse.status);
          console.error("❌ Error object:", error);
          console.error("❌ Error message:", error.message || error.error);
          console.error("❌ Error details:", error.details);
          
          // Don't throw - email failure shouldn't prevent invoice creation
          // But show a warning toast with the actual error message
          const errorMessage = error.message || error.error || "Unknown error";
          toast({
            title: "Invoice created",
            description: `Invoice created successfully, but email could not be sent: ${errorMessage}`,
            variant: "destructive",
          });
        } else {
          const result = await emailResponse.json();
          console.log("✅ Email API response:", result);
          
          // Check if email was actually sent or just logged
          if (result.emailService === "console" || result.sent === false) {
            console.warn("⚠️ Email service is in console mode - email was NOT actually sent");
            toast({
              title: "Invoice created",
              description: "Invoice created, but email service is in console mode. Email was logged to server console only.",
              variant: "default",
            });
          } else {
            console.log("✅ Email sent successfully");
          }
        }
      } catch (emailError) {
        console.error("❌ Error calling email API:", emailError);
        // Don't throw - email failure shouldn't prevent invoice creation
        toast({
          title: "Invoice created",
          description: "Invoice created successfully, but there was an error sending the email. Please check server logs.",
          variant: "destructive",
        });
      }

      return invoiceId;
    },
    onSuccess: async () => {
      // Invalidate and refetch invoices to show the newly created invoice
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/cfi/invoices'],
      });
      await queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === '/api/cfi/invoices',
      });
      await refetchInvoices();
      toast({
        title: "Invoice sent",
        description: "Invoice has been created and sent to the client.",
      });
      // Reset form and close preview
      setSelectedOwnerId("");
      setSelectedAircraftId("");
      setDescription("");
      setFlightDate("");
      setHours("");
      setRatePerHour("150");
      setShowPreview(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId || !selectedAircraftId || !description || !flightDate || !hours || !ratePerHour) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  const filteredAircraft = selectedOwnerId
    ? aircraft.filter((a: any) => a.owner_id === selectedOwnerId)
    : aircraft;

  const totalAmount = hours && ratePerHour
    ? (parseFloat(hours) * parseFloat(ratePerHour)).toFixed(2)
    : "0.00";

  // Get preview data
  const selectedOwner = owners.find((o: any) => o.id === selectedOwnerId);
  const selectedAircraft = aircraft.find((a: any) => a.id === selectedAircraftId);

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
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" data-testid="tab-requests">Service Requests</TabsTrigger>
            <TabsTrigger value="aircraft" data-testid="tab-aircraft">Aircraft</TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="clients" data-testid="tab-clients">Clients</TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">CFI Schedule</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Flight Logs</TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Service Requests */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Service Requests</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage service requests from aircraft owners
                </p>
              </div>
              <Badge variant="secondary">
                {serviceRequests.length} total
              </Badge>
            </div>
            {serviceRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No service requests yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Service requests from owners will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <KanbanBoard items={serviceRequests.map((sr: any) => {
                // Map database statuses to Kanban board statuses
                const statusMap: Record<string, 'new' | 'in_progress' | 'done'> = {
                  'pending': 'new',
                  'in_progress': 'in_progress',
                  'completed': 'done',
                  'cancelled': 'done', // Treat cancelled as done
                };
                
                // Format requested date/time
                let requestedFor = 'TBD';
                if (sr.requested_date) {
                  const date = new Date(sr.requested_date);
                  requestedFor = format(date, 'MMM d, yyyy');
                  if (sr.requested_time) {
                    requestedFor += ` ${sr.requested_time}`;
                  }
                } else if (sr.requested_for) {
                  requestedFor = sr.requested_for;
                }
                
                // Combine description and notes for display
                const displayNotes = sr.description || sr.notes || '';
                
                return {
                  id: sr.id,
                  tailNumber: sr.aircraft?.tail_number || 'N/A',
                  type: sr.service_type,
                  requestedFor,
                  notes: displayNotes,
                  status: statusMap[sr.status] || 'new',
                  ownerName: sr.owner?.full_name || sr.owner?.email || undefined,
                };
              })} />
            )}
          </TabsContent>

          {/* Aircraft (Admin) */}
          <TabsContent value="aircraft" className="space-y-4">
            {isLoadingAircraft ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading aircraft...</p>
                </CardContent>
              </Card>
            ) : aircraftError ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-destructive font-medium mb-2">Error loading aircraft</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {aircraftError instanceof Error ? aircraftError.message : 'Unknown error occurred'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/aircraft/full'] })}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AircraftTable items={aircraftFull} />
            )}
          </TabsContent>

          {/* Maintenance (Admin) */}
          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceList items={maintenanceItems.map((m: any) => {
              // Calculate status based on due dates and hobbs
              let status: "ok" | "due_soon" | "overdue" = "ok";
              
              if (m.due_date) {
                const dueDate = new Date(m.due_date);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDue < 0) {
                  status = "overdue";
                } else if (daysUntilDue <= 30) {
                  status = "due_soon";
                }
              } else if (m.due_hobbs && m.aircraft?.hobbs_hours) {
                const hobbsRemaining = m.due_hobbs - m.aircraft.hobbs_hours;
                if (hobbsRemaining < 0) {
                  status = "overdue";
                } else if (hobbsRemaining <= 10) {
                  status = "due_soon";
                }
              }

              // Use database status if available
              if (m.status === 'overdue') status = 'overdue';
              if (m.status === 'due_soon') status = 'due_soon';

              return {
                id: m.id,
                tailNumber: m.aircraft?.tail_number || 'N/A',
                title: m.item_name,
                hobbsDue: m.due_hobbs,
                hobbsCurrent: m.aircraft?.hobbs_hours,
                calendarDue: m.due_date,
                status,
              };
            })} />
          </TabsContent>

          {/* Clients */}
          <TabsContent value="clients" className="space-y-4">
            <ClientsTable />
          </TabsContent>

          {/* CFI Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">CFI Schedule</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage flight instruction schedules
                </p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Schedule functionality coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flight Logs */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Flight Logs</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and sign off on flight logs
                </p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Flight logs functionality coming soon.</p>
              </CardContent>
            </Card>
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
                <form onSubmit={handlePreview} className="space-y-4">
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
                        max={new Date().toISOString().split('T')[0]}
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
                      data-testid="button-preview-invoice"
                    >
                      Preview Invoice
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Invoice Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Invoice Preview</DialogTitle>
                  <DialogDescription>
                    Review the invoice details before sending to the client.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Client</p>
                      <p className="text-base">{selectedOwner?.full_name || selectedOwner?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Aircraft</p>
                      <p className="text-base">{selectedAircraft?.tail_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-base">{description || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Flight Date</p>
                      <p className="text-base">{flightDate ? format(new Date(flightDate), 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Line Items</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{description} - {flightDate ? format(new Date(flightDate), 'MMM d, yyyy') : ''}</p>
                          <p className="text-sm text-muted-foreground">
                            {hours} {parseFloat(hours) === 1 ? 'hr' : 'hrs'} × ${parseFloat(ratePerHour).toFixed(2)}/hr
                          </p>
                        </div>
                        <p className="font-bold">${totalAmount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold">${totalAmount}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createAndSendInvoiceMutation.mutate()}
                    disabled={createAndSendInvoiceMutation.isPending}
                    data-testid="button-send-to-client"
                  >
                    {createAndSendInvoiceMutation.isPending ? "Sending..." : "Send to Client"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Invoice List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">My Instruction Invoices</h3>
                {invoices.length > 0 && (
                  <Badge variant="secondary">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</Badge>
                )}
              </div>
              
              {invoicesError ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-destructive font-medium mb-2">Error loading invoices</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {invoicesError instanceof Error ? invoicesError.message : 'Unknown error occurred'}
                    </p>
                    {!user && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Please log in to view invoices.
                      </p>
                    )}
                    {user && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchInvoices()}
                      >
                        Retry
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : isLoadingInvoices ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Loading invoices...</p>
                  </CardContent>
                </Card>
              ) : !user ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-2">Authentication required</p>
                    <p className="text-sm text-muted-foreground">
                      Please log in to view and manage invoices.
                    </p>
                  </CardContent>
                </Card>
              ) : invoices.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-2">No instruction invoices yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Create an invoice using the form above to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    // Calculate total from all invoice lines
                    let calculatedTotal = invoice.amount;
                    if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
                      calculatedTotal = invoice.invoice_lines.reduce((sum, line) => {
                        return sum + (line.quantity * line.unit_cents / 100);
                      }, 0);
                    }
                    
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
                                variant={
                                  invoice.status === 'paid' ? 'default' :
                                  invoice.status === 'finalized' ? 'secondary' :
                                  'outline'
                                }
                                data-testid={`badge-status-${invoice.id}`}
                              >
                                {invoice.status}
                              </Badge>
                              {invoice.category && (
                                <Badge variant="outline" className="text-xs">
                                  {invoice.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Invoice #</p>
                              <p className="font-mono">{invoice.invoice_number}</p>
                            </div>
                            
                            {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Line Items</p>
                                {invoice.invoice_lines.map((line, idx) => (
                                  <div key={idx} className="pl-2 border-l-2">
                                    <p className="text-sm font-medium">{line.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {line.quantity} {line.quantity === 1 ? 'hr' : 'hrs'} × ${(line.unit_cents / 100).toFixed(2)}/hr = ${(line.quantity * line.unit_cents / 100).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-xl font-bold">${calculatedTotal.toFixed(2)}</p>
                              </div>
                              
                              {invoice.status === 'finalized' && (
                                <p className="text-sm text-muted-foreground">
                                  Sent to client
                                </p>
                              )}
                              
                              {invoice.status === 'paid' && invoice.paid_date && (
                                <div className="text-right">
                                  <p className="text-sm font-medium text-green-600">
                                    ✓ Paid
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(invoice.paid_date), 'MMM d, yyyy')}
                                  </p>
                                </div>
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
