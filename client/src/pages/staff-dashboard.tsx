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
import { Calendar, FileText, DollarSign, Wrench, Plane, Settings2 } from "lucide-react";
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
import { Link } from "wouter";
import { KanbanBoard } from "@/components/kanban-board";
import { AircraftTable } from "@/components/aircraft-table";
import { MaintenanceList } from "@/components/maintenance-list";
import { ClientsTable } from "@/components/clients-table";
import { ServiceRequestEditDialog } from "@/components/service-request-edit-dialog";
import { FlightLogsList } from "@/components/flight-logs-list";
import { CFISchedule } from "@/components/cfi-schedule";
import UnifiedPricingConfigurator from "./admin/UnifiedPricingConfigurator";
import { authenticatedFetch } from "@/lib/auth-utils";

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
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);


  // Fetch owners
  const { data: owners = [], isLoading: isLoadingOwners, error: ownersError } = useQuery({
    queryKey: ['/api/owners'],
    queryFn: async () => {
      console.log('🔍 Fetching owners for invoice creation...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role')
        .eq('role', 'owner')
        .order('full_name');
      if (error) {
        console.error('❌ Error fetching owners:', error);
        throw error;
      }
      console.log('✅ Fetched owners:', data?.length || 0);
      return data || [];
    },
  });

  // Log owners data and show error toast if needed
  useEffect(() => {
    if (owners && owners.length > 0) {
      console.log('👥 Available owners for invoice:', owners.length);
    } else if (!isLoadingOwners && owners.length === 0) {
      console.warn('⚠️ No owners found in database');
    }
    
    if (ownersError) {
      toast({
        title: 'Error loading clients',
        description: ownersError instanceof Error ? ownersError.message : 'Failed to load clients. Please check your permissions.',
        variant: 'destructive',
      });
    }
  }, [owners, isLoadingOwners, ownersError, toast]);

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
      try {
        // First, try to fetch aircraft with nested owner relation
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
          console.warn('⚠️ Nested query failed, trying separate queries:', error.message);
          
          // Check if error is about missing columns (make, model, etc.)
          const isColumnError = error.message?.includes('column') || 
                               error.message?.includes('does not exist') ||
                               error.code === '42703';
          
          if (isColumnError) {
            // Missing columns - fetch only basic columns that should always exist
            const aircraftResult = await supabase
              .from('aircraft')
              .select('id, tail_number, base_location, owner_id')
              .order('tail_number');
            
            if (aircraftResult.error) {
              console.error('❌ Error fetching aircraft:', aircraftResult.error);
              throw new Error(`Database schema issue: Missing columns in aircraft table. Please run the fix-aircraft-table.sql script. Original error: ${error.message}`);
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
              
              if (ownersResult.error) {
                console.warn('⚠️ Error fetching owners, continuing without owner data:', ownersResult.error);
              } else if (ownersResult.data) {
                ownersMap = ownersResult.data.reduce((acc: any, owner: any) => {
                  acc[owner.id] = { full_name: owner.full_name, email: owner.email };
                  return acc;
                }, {});
              }
            }
            
            // Combine data - add defaults for missing columns
            data = aircraftData.map((ac: any) => ({
              ...ac,
              make: ac.make || null,
              model: ac.model || null,
              class: ac.class || null,
              owner: ownersMap[ac.owner_id] || null,
            }));
          } else {
            // Other error - try fetching without nested relations
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
              
              if (ownersResult.error) {
                console.warn('⚠️ Error fetching owners, continuing without owner data:', ownersResult.error);
              } else if (ownersResult.data) {
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
          }
        }
        
        if (!data) {
          throw new Error('No aircraft data returned');
        }
        
        // Transform to match AircraftTable interface
        return (data || []).map((ac: any) => {
          const ownerRecord = ac.owner || null;
          const ownerName = ownerRecord?.full_name || ownerRecord?.email || null;

          return {
            id: ac.id,
            tailNumber: ac.tail_number,
            make: ac.make || 'N/A',
            model: ac.model || '',
            class: ac.class || 'Unknown',
            baseAirport: ac.base_location || 'KAPA',
            owner: ownerName || 'Unassigned',
            ownerId: ac.owner_id ?? null,
            ownerEmail: ownerRecord?.email ?? null,
          };
        });
      } catch (err: any) {
        console.error('❌ Error in aircraft query:', err);
        // Provide more helpful error message
        if (err.message?.includes('permission') || err.code === 'PGRST301') {
          throw new Error('Permission denied. Please check your authentication and try again.');
        } else if (err.message?.includes('relation') || err.code === 'PGRST116') {
          throw new Error('Aircraft table not found. Please ensure the database schema is set up correctly.');
        } else {
          throw err;
        }
      }
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
  const { data: serviceRequests = [], refetch: refetchServiceRequests, error: serviceRequestsError, isLoading: isLoadingServiceRequests } = useQuery({
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching service requests...');
        
        const res = await authenticatedFetch('/api/service-requests');
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({ 
            error: 'Network error',
            message: res.statusText 
          }));
          
          // Provide more helpful error messages
          if (res.status === 503) {
            throw new Error(err.message || 'Server configuration error. Please contact support.');
          } else if (res.status === 403) {
            throw new Error('You do not have permission to view service requests.');
          }
          
          throw new Error(err.message || `Failed to load service requests (${res.status})`);
        }
        
        const json = await res.json();
        console.log('✅ Fetched service requests:', json.serviceRequests?.length || 0);
        return json.serviceRequests || [];
      } catch (error) {
        console.error('❌ Error fetching service requests:', error);
        // The authenticatedFetch will handle 401 errors and session refresh
        throw error;
      }
    },
    // Refetch every 30 seconds to catch new requests
    refetchInterval: 30000,
    // Retry with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle service request status change
  const handleStatusChange = async (requestId: string, status: "pending" | "in_progress" | "completed") => {
    try {
      const res = await authenticatedFetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to update status');
      }
      
      toast({ 
        title: 'Status updated', 
        description: `Service request status changed to ${status}` 
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
    } catch (error) {
      console.error('Error updating service request status:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update status', 
        variant: 'destructive' 
      });
      throw error;
    }
  };

  // Handle service request card selection
  const handleCardSelect = (requestId: string) => {
    const request = serviceRequests.find((sr: any) => sr.id === requestId);
    if (request) {
      setSelectedServiceRequest(request);
      setIsEditDialogOpen(true);
    }
  };

  // Handle service requests loading errors
  useEffect(() => {
    if (serviceRequestsError) {
      console.error('Service requests query error:', serviceRequestsError);
      toast({
        title: 'Error loading service requests',
        description: serviceRequestsError instanceof Error ? serviceRequestsError.message : 'Failed to load service requests. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [serviceRequestsError, toast]);

  // Fetch maintenance items
  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      // Use 'maintenance' table instead of 'maintenance_due'
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          id,
          aircraft_id,
          item_name,
          due_date,
          due_hobbs,
          status,
          aircraft:aircraft_id(tail_number)
        `)
        .order('due_date', { ascending: true });
      if (error) throw error;
      
      // Fetch hobbs_hours separately for each aircraft
      if (data && data.length > 0) {
        const aircraftIds = [...new Set(data.map((m: any) => m.aircraft_id).filter(Boolean))];
        const { data: aircraftData } = await supabase
          .from('aircraft')
          .select('id, hobbs_hours')
          .in('id', aircraftIds);
        
        const hobbsMap = (aircraftData || []).reduce((acc: any, ac: any) => {
          acc[ac.id] = ac.hobbs_hours;
          return acc;
        }, {});
        
        // Add hobbs_hours to each maintenance item and map old field names to new
        return data.map((m: any) => ({
          ...m,
          // Map new column names to old names for compatibility
          item: m.item_name,
          due_at_date: m.due_date,
          due_at_hours: m.due_hobbs,
          severity: m.status === 'overdue' ? 'critical' : m.status === 'due_soon' ? 'warning' : 'info',
          aircraft: m.aircraft ? {
            ...m.aircraft,
            hobbs_hours: hobbsMap[m.aircraft_id] || null
          } : null
        }));
      }
      
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
      // In dev mode without user, return empty array (RLS will block anyway)
      // User should log in to see invoices
      if (!user && isDev) {
        return [];
      }

      // In production, require authentication
      if (!user) {
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
      if (!isAdmin && user) {
        query = query.eq('created_by_cfi_id', user.id);
      }

      let { data, error } = await query.order('created_at', { ascending: false });
      
      // If nested query fails, try fetching separately
      if (error && (error.message?.includes('invoice_lines') || error.message?.includes('aircraft') || error.message?.includes('owner'))) {
        // Build base query without nested relations
        let baseQuery = supabase
          .from('invoices')
          .select('*')
          .eq('category', 'instruction');

        if (!isAdmin && user) {
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

      // Create the invoice (aircraft_id is optional)
      // Convert "__none__" to null for optional aircraft
      const aircraftId = selectedAircraftId === "__none__" || !selectedAircraftId ? null : selectedAircraftId;
      
      const { data: invoiceData, error: createError } = await supabase.rpc('create_instruction_invoice', {
        p_owner_id: selectedOwnerId,
        p_aircraft_id: aircraftId,
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
        // Get auth token for API request
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        const emailResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
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
    if (!selectedOwnerId || !description || !flightDate || !hours || !ratePerHour) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields (Client, Description, Flight Date, Hours, and Rate).",
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
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" data-testid="link-home-from-logo">
                <img
                  src={logoImage}
                  alt="Freedom Aviation"
                  className="h-8 w-auto transition-opacity hover:opacity-80"
                />
              </Link>
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Freedom Aviation - Staff</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-return-home">
                  Back to Home
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Staff Dashboard</h2>
            <p className="text-muted-foreground">Manage service requests, aircraft, maintenance, and invoices</p>
          </div>

          <Tabs defaultValue="invoices" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
              <TabsTrigger value="requests" data-testid="tab-requests" className="text-xs sm:text-sm">Service Requests</TabsTrigger>
              <TabsTrigger value="aircraft" data-testid="tab-aircraft" className="text-xs sm:text-sm">Aircraft</TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance" className="text-xs sm:text-sm">Maintenance</TabsTrigger>
              <TabsTrigger value="clients" data-testid="tab-clients" className="text-xs sm:text-sm">Clients</TabsTrigger>
              <TabsTrigger value="schedule" data-testid="tab-schedule" className="text-xs sm:text-sm">Schedule</TabsTrigger>
              <TabsTrigger value="logs" data-testid="tab-logs" className="text-xs sm:text-sm">Flight Logs</TabsTrigger>
              <TabsTrigger value="invoices" data-testid="tab-invoices" className="text-xs sm:text-sm">Invoices</TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing" className="text-xs sm:text-sm">Pricing</TabsTrigger>
            </TabsList>

          {/* Service Requests */}
          <TabsContent value="requests" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-semibold">Service Requests</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage service requests from aircraft owners
                </p>
              </div>
              {serviceRequests.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {serviceRequests.length} total
                </Badge>
              )}
            </div>
            {isLoadingServiceRequests ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading service requests...</p>
                </CardContent>
              </Card>
            ) : serviceRequestsError ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-destructive font-medium mb-2">Error loading service requests</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {serviceRequestsError instanceof Error ? serviceRequestsError.message : 'Unknown error occurred'}
                  </p>
                  {serviceRequestsError instanceof Error && serviceRequestsError.message.includes('Permission') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Make sure you're logged in as an admin or staff member with proper permissions.
                    </p>
                  )}
                  {serviceRequestsError instanceof Error && serviceRequestsError.message.includes('table not found') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      The database schema may need to be set up. Check the SETUP.md guide.
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchServiceRequests()}
                    >
                      Retry
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : serviceRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No service requests yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Service requests from owners will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <KanbanBoard 
                  items={serviceRequests
                    .filter((sr: any) => sr && sr.id) // Filter out any null/undefined items or items without id
                    .map((sr: any) => {
                      // Map database statuses to Kanban board statuses
                      const statusMap: Record<string, 'new' | 'in_progress' | 'done'> = {
                        'pending': 'new',
                        'in_progress': 'in_progress',
                        'completed': 'done',
                        'cancelled': 'done', // Treat cancelled as done
                      };
                      
                      // Format requested date/time
                      let requestedFor = 'TBD';
                      if (sr.requested_departure) {
                        const date = new Date(sr.requested_departure);
                        requestedFor = format(date, 'MMM d, yyyy HH:mm');
                      } else if (sr.airport) {
                        requestedFor = sr.airport;
                      }
                      
                      // Use description for display
                      const displayNotes = sr.description || '';
                      
                      return {
                        id: sr.id,
                        tailNumber: sr.aircraft?.tail_number || 'N/A',
                        type: sr.service_type,
                        requestedFor,
                        notes: displayNotes,
                        status: statusMap[sr.status] || 'new',
                        ownerName: sr.owner?.full_name || sr.owner?.email || undefined,
                      };
                    })}
                  onCardSelect={handleCardSelect}
                  onStatusChange={handleStatusChange}
                />
                <ServiceRequestEditDialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                  serviceRequest={selectedServiceRequest}
                  onSuccess={() => {
                    refetchServiceRequests();
                  }}
                />
              </>
            )}
          </TabsContent>

          {/* Aircraft (Admin) */}
          <TabsContent value="aircraft" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Aircraft</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                View and manage all aircraft in the fleet
              </p>
            </div>
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
                  <p className="text-sm text-muted-foreground mb-2">
                    {aircraftError instanceof Error ? aircraftError.message : 'Unknown error occurred'}
                  </p>
                  {aircraftError instanceof Error && aircraftError.message.includes('Permission') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Make sure you're logged in as an admin or staff member with proper permissions.
                    </p>
                  )}
                  {aircraftError instanceof Error && aircraftError.message.includes('table not found') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      The database schema may need to be set up. Check the SETUP.md guide.
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/aircraft/full'] })}
                    >
                      Retry
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AircraftTable items={aircraftFull} owners={owners} />
            )}
          </TabsContent>

          {/* Maintenance (Admin) */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Maintenance</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Track maintenance schedules and due dates
              </p>
            </div>
            <MaintenanceList items={maintenanceItems.map((m: any) => {
              // Calculate status based on due dates and hobbs
              // Use severity from database, or calculate from remaining_days/hours
              let status: "ok" | "due_soon" | "overdue" = "ok";
              
              if (m.severity === 'high' || m.severity === 'critical') {
                status = "overdue";
              } else if (m.severity === 'medium') {
                status = "due_soon";
              } else if (m.remaining_days !== null && m.remaining_days !== undefined) {
                // Use remaining_days if available
                if (m.remaining_days < 0) {
                  status = "overdue";
                } else if (m.remaining_days <= 30) {
                  status = "due_soon";
                }
              } else if (m.due_at_date) {
                const dueDate = new Date(m.due_at_date);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDue < 0) {
                  status = "overdue";
                } else if (daysUntilDue <= 30) {
                  status = "due_soon";
                }
              } else if (m.remaining_hours !== null && m.remaining_hours !== undefined) {
                // Use remaining_hours if available
                if (m.remaining_hours < 0) {
                  status = "overdue";
                } else if (m.remaining_hours <= 10) {
                  status = "due_soon";
                }
              } else if (m.due_at_hours && m.aircraft?.hobbs_hours) {
                const hobbsRemaining = m.due_at_hours - m.aircraft.hobbs_hours;
                if (hobbsRemaining < 0) {
                  status = "overdue";
                } else if (hobbsRemaining <= 10) {
                  status = "due_soon";
                }
              }

              return {
                id: m.id,
                tailNumber: m.aircraft?.tail_number || 'N/A',
                title: m.item,
                hobbsDue: m.due_at_hours,
                hobbsCurrent: m.aircraft?.hobbs_hours,
                calendarDue: m.due_at_date,
                status,
              };
            })} />
          </TabsContent>

          {/* Clients */}
          <TabsContent value="clients" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Clients</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                View and manage client accounts
              </p>
            </div>
            <ClientsTable />
          </TabsContent>

          {/* CFI Schedule */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">CFI Schedule</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                View and manage flight instruction schedules
              </p>
            </div>

            <CFISchedule />

            {/* Instruction Requests */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Pending Instruction Requests</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Instruction requests from owners awaiting CFI assignment
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingServiceRequests ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading instruction requests...
                  </div>
                ) : serviceRequestsError ? (
                  <div className="py-8 text-center text-destructive">
                    Error loading instruction requests: {serviceRequestsError.message}
                  </div>
                ) : (() => {
                  // Filter for Flight Instruction requests and sort by date/time
                  const instructionRequests = (serviceRequests || [])
                    .filter((sr: any) => sr && sr.id && sr.service_type === "Flight Instruction")
                    .sort((a: any, b: any) => {
                      // Sort by requested_date, then requested_time
                      // Requests without dates go to the end
                      if (!a.requested_date && !b.requested_date) {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      }
                      if (!a.requested_date) return 1;
                      if (!b.requested_date) return -1;
                      
                      const dateA = new Date(a.requested_date + (a.requested_time ? `T${a.requested_time}` : 'T00:00:00')).getTime();
                      const dateB = new Date(b.requested_date + (b.requested_time ? `T${b.requested_time}` : 'T00:00:00')).getTime();
                      return dateA - dateB;
                    });

                  if (instructionRequests.length === 0) {
                    return (
                      <div className="py-8 text-center text-muted-foreground">
                        No flight instruction requests at this time.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {instructionRequests.map((request: any) => {
                        const isAssigned = false;
                        const isAssignedToOther = false;
                        
                        return (
                          <Card key={request.id} className={isAssigned ? "border-primary" : ""}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold">
                                      {request.owner?.full_name || request.owner?.email || "Unknown Owner"}
                                    </h3>
                                    {request.aircraft && (
                                      <Badge variant="outline">
                                        {request.aircraft.tail_number}
                                      </Badge>
                                    )}
                                    <Badge variant={request.status === "pending" ? "secondary" : request.status === "in_progress" ? "default" : "outline"}>
                                      {request.status}
                                    </Badge>
                                    {isAssigned && (
                                      <Badge variant="default">Assigned to You</Badge>
                                    )}
                                    {isAssignedToOther && (
                                      <Badge variant="outline">Assigned to Another CFI</Badge>
                                    )}
                                  </div>
                                  
                                  {request.requested_date && (
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(request.requested_date).toLocaleDateString()}
                                      </span>
                                      {request.requested_time && (
                                        <span className="flex items-center gap-1">
                                          {request.requested_time}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {request.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {request.description}
                                    </p>
                                  )}
                                  
                                  {request.notes && (
                                    <p className="text-sm text-muted-foreground italic">
                                      Notes: {request.notes}
                                    </p>
                                  )}
                                  
                                  <div className="text-xs text-muted-foreground">
                                    Requested: {new Date(request.created_at).toLocaleString()}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                  {/* Assignment feature disabled (column not available) */}
                                  
                                  {/* Unassign disabled */}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flight Logs */}
          <TabsContent value="logs" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Flight Logs</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Review and sign off on flight logs
              </p>
            </div>
            <FlightLogsList />
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-semibold">Flight Instruction Invoices</h2>
                </div>
                <p className="text-sm text-muted-foreground">Create and manage instruction invoices for clients</p>
              </div>
            </div>

            {/* Create Invoice Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Instruction Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreview} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner">Client *</Label>
                      {ownersError ? (
                        <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md">
                          <p className="text-sm text-destructive">
                            Error loading clients: {ownersError instanceof Error ? ownersError.message : 'Unknown error'}
                          </p>
                        </div>
                      ) : (
                        <Select 
                          value={selectedOwnerId} 
                          onValueChange={setSelectedOwnerId}
                          disabled={isLoadingOwners}
                        >
                          <SelectTrigger id="owner" data-testid="select-owner">
                            <SelectValue placeholder={
                              isLoadingOwners ? "Loading clients..." : 
                              owners.length === 0 ? "No clients found" : 
                              "Select client"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingOwners ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Loading clients...
                              </div>
                            ) : owners.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No clients found. Create a client first.
                              </div>
                            ) : (
                              owners
                                .filter((owner: any) => owner && owner.id)
                                .map((owner: any) => (
                                  <SelectItem key={owner.id} value={owner.id}>
                                    {owner.full_name || owner.email}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aircraft">Aircraft (Optional)</Label>
                      <Select 
                        value={selectedAircraftId} 
                        onValueChange={setSelectedAircraftId}
                        disabled={!selectedOwnerId}
                      >
                        <SelectTrigger id="aircraft" data-testid="select-aircraft">
                          <SelectValue placeholder="Select aircraft (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {filteredAircraft
                            .filter((ac: any) => ac && ac.id)
                            .map((ac: any) => (
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
                      size="lg"
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
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Client</p>
                      <p className="text-base font-medium">{selectedOwner?.full_name || selectedOwner?.email || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Aircraft</p>
                      <p className="text-base font-mono font-semibold">{selectedAircraft?.tail_number || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-base">{description || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Flight Date</p>
                      <p className="text-base">{flightDate ? format(new Date(flightDate), 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Line Items</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium mb-1">{description} - {flightDate ? format(new Date(flightDate), 'MMM d, yyyy') : ''}</p>
                          <p className="text-sm text-muted-foreground">
                            {hours} {parseFloat(hours) === 1 ? 'hr' : 'hrs'} × ${parseFloat(ratePerHour).toFixed(2)}/hr
                          </p>
                        </div>
                        <p className="text-lg font-bold ml-4">${totalAmount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center bg-muted/50 p-4 rounded-lg">
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
                    size="lg"
                  >
                    {createAndSendInvoiceMutation.isPending ? "Sending..." : "Send to Client"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Invoice List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Instruction Invoices</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin ? 'All invoices' : 'Your invoices'}
                  </p>
                </div>
                {invoices.length > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                  </Badge>
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
                <div className="grid grid-cols-1 gap-4">
                  {invoices
                    .filter((invoice) => invoice && invoice.id)
                    .map((invoice) => {
                    // Calculate total from all invoice lines
                    let calculatedTotal = invoice.amount;
                    if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
                      calculatedTotal = invoice.invoice_lines.reduce((sum, line) => {
                        return sum + (line.quantity * line.unit_cents / 100);
                      }, 0);
                    }
                    
                    return (
                      <Card key={invoice.id} data-testid={`invoice-${invoice.id}`} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg font-mono">
                                  {invoice.aircraft?.tail_number || 'N/A'}
                                </CardTitle>
                                <Badge 
                                  variant={
                                    invoice.status === 'paid' ? 'default' :
                                    invoice.status === 'finalized' ? 'secondary' :
                                    'outline'
                                  }
                                  data-testid={`badge-status-${invoice.id}`}
                                  className="capitalize"
                                >
                                  {invoice.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {invoice.owner?.full_name || invoice.owner?.email || 'Unknown Client'}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                Invoice #{invoice.invoice_number}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground mb-1">Total</p>
                              <p className="text-2xl font-bold">${calculatedTotal.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Line Items</p>
                                <div className="space-y-2">
                                  {invoice.invoice_lines.map((line, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{line.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {line.quantity} {line.quantity === 1 ? 'hr' : 'hrs'} × ${(line.unit_cents / 100).toFixed(2)}/hr
                                        </p>
                                      </div>
                                      <p className="text-sm font-semibold">
                                        ${(line.quantity * line.unit_cents / 100).toFixed(2)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex items-center gap-4">
                                {invoice.created_at && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="text-sm">
                                      {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                )}
                                {invoice.due_date && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Due Date</p>
                                    <p className="text-sm">
                                      {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                {invoice.status === 'finalized' && (
                                  <p className="text-sm text-muted-foreground">
                                    Sent to client
                                  </p>
                                )}
                                
                                {invoice.status === 'paid' && invoice.paid_date && (
                                  <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                      ✓ Paid
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(invoice.paid_date), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                )}
                              </div>
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

          {/* Pricing Configurator */}
          <TabsContent value="pricing" className="space-y-6">
            <UnifiedPricingConfigurator />
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}
