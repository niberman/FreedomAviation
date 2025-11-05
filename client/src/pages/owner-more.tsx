import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plane, DollarSign } from "lucide-react";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { PasswordChangeCard } from "@/features/owner/components/PasswordChangeCard";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DEMO_AIRCRAFT } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";

export default function OwnerMore() {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle payment success/failure redirects from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const invoiceId = params.get("invoice_id");

    if (paymentStatus === "success" && invoiceId) {
      toast({
        title: "Payment Successful",
        description: "Your invoice payment has been processed successfully.",
      });
      // Refetch invoices to show updated status
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      // Remove query params from URL
      setLocation("/dashboard/more");
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
      // Remove query params from URL
      setLocation("/dashboard/more");
    }
  }, [toast, queryClient, setLocation]);

  const { data: aircraftList } = useQuery({
    queryKey: ["/api/aircraft", { ownerId: isDemo ? "demo" : user?.id }],
    enabled: isDemo || Boolean(user?.id),
    queryFn: async () => {
      if (isDemo) return [DEMO_AIRCRAFT];
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .eq("owner_id", user.id);
      
      if (error) throw error;
      return data || [];
    }
  });
  
  const aircraft = aircraftList && aircraftList.length > 0 ? aircraftList[0] : null;

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["service-requests", isDemo ? "demo" : user?.id, aircraft?.id],
    enabled: isDemo || Boolean(user?.id && aircraft?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_SERVICE_REQUESTS } = await import("@/lib/demo-data");
        return DEMO_SERVICE_REQUESTS;
      }
      if (!user?.id || !aircraft?.id) return [];
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("aircraft_id", aircraft.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("Error fetching service requests:", error);
        return [];
      }
      
      return data || [];
    }
  });

  const { data: serviceTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["service-tasks", aircraft?.id],
    enabled: isDemo || Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_SERVICE_TASKS } = await import("@/lib/demo-data");
        return DEMO_SERVICE_TASKS;
      }
      if (!aircraft?.id) return [];
      
      const { data, error } = await supabase
        .from("service_tasks")
        .select("*")
        .eq("aircraft_id", aircraft.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("Error fetching service tasks:", error);
        return [];
      }
      
      return data.map((task) => ({
        id: task.id,
        aircraft_id: task.aircraft_id,
        type: task.type,
        status: task.status,
        assigned_to: task.assigned_to,
        notes: task.notes,
        photos: Array.isArray(task.photos) ? task.photos.filter((p: any): p is string => typeof p === 'string') : [],
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ["invoices", aircraft?.id, isDemo ? "demo" : user?.id],
    enabled: isDemo || Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_INVOICES } = await import("@/lib/demo-data");
        // Transform demo data to match expected format
        return DEMO_INVOICES.map(inv => ({
          ...inv,
          invoice_lines: inv.line_items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_cents: Math.round(item.unit_price * 100),
          })) || [],
        }));
      }
      if (!aircraft?.id || !user?.id) return [];
      
      console.log("Fetching invoices for aircraft:", aircraft.id, "owner:", user.id);
      
      // Try to fetch invoices with nested invoice_lines first
      let { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_lines(id, description, quantity, unit_cents)
        `)
        .eq("aircraft_id", aircraft.id)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      
      // If nested query fails, try fetching invoices separately and then invoice_lines
      if (error && error.message?.includes('invoice_lines')) {
        console.warn("Nested query failed, trying separate queries:", error.message);
        
        // Fetch invoices first
        const invoicesResult = await supabase
          .from("invoices")
          .select("*")
          .eq("aircraft_id", aircraft.id)
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6);
        
        if (invoicesResult.error) {
          error = invoicesResult.error;
          data = null;
        } else {
          // Fetch invoice_lines separately for each invoice
          const invoiceIds = (invoicesResult.data || []).map((inv: any) => inv.id);
          
          if (invoiceIds.length > 0) {
            const linesResult = await supabase
              .from("invoice_lines")
              .select("id, invoice_id, description, quantity, unit_cents")
              .in("invoice_id", invoiceIds);
            
            if (linesResult.error) {
              console.warn("Error fetching invoice lines separately:", linesResult.error);
            }
            
            // Combine invoices with their lines
            const linesByInvoiceId = (linesResult.data || []).reduce((acc: any, line: any) => {
              if (!acc[line.invoice_id]) {
                acc[line.invoice_id] = [];
              }
              acc[line.invoice_id].push({
                id: line.id,
                description: line.description,
                quantity: Number(line.quantity),
                unit_cents: Number(line.unit_cents),
              });
              return acc;
            }, {});
            
            data = (invoicesResult.data || []).map((invoice: any) => ({
              ...invoice,
              invoice_lines: linesByInvoiceId[invoice.id] || [],
            }));
            
            error = null; // Clear error since we successfully fetched
          } else {
            data = invoicesResult.data || [];
            error = null;
          }
        }
      }
      
      if (error) {
        console.error("Error fetching invoices:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // Check for specific error types
        if (error.message?.includes('JWT') || error.message?.includes('authentication') || error.code === 'PGRST301') {
          throw new Error('Authentication required. Please log in to view invoices.');
        }
        
        if (error.code === 'PGRST116') {
          throw new Error('No invoices found. This might be a permissions issue.');
        }
        
        // Throw the error so react-query can handle it
        throw new Error(error.message || 'Failed to load invoices. Please try again.');
      }
      
      console.log("Fetched invoices:", data?.length || 0, data);
      
      // Transform the data to ensure invoice_lines is properly formatted
      const transformedInvoices = (data || []).map((invoice: any) => ({
        ...invoice,
        invoice_lines: Array.isArray(invoice.invoice_lines) 
          ? invoice.invoice_lines.map((line: any) => ({
              id: line.id,
              description: line.description,
              quantity: Number(line.quantity),
              unit_cents: Number(line.unit_cents),
            }))
          : [],
      }));
      
      return transformedInvoices;
    },
  });

  // Handle invoice query errors
  useEffect(() => {
    if (invoicesError) {
      console.error("Invoice query error:", invoicesError);
      toast({
        title: "Error loading invoices",
        description: invoicesError instanceof Error 
          ? invoicesError.message 
          : "Failed to load invoices. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }, [invoicesError, toast]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Freedom Aviation</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8 max-w-7xl">
        {isDemo && <DemoBanner />}
        
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">More Details</h2>
          <p className="text-muted-foreground">Manage your account, billing, and services</p>
        </div>

        {/* Billing & Invoices Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Billing & Invoices</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <BillingCard invoices={invoices} isLoading={invoicesLoading} />
            <CreditsOverview />
          </div>
        </div>

        {/* Service History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Service History</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <ServiceTimeline 
              tasks={serviceTasks} 
              requests={serviceRequests}
              isLoading={tasksLoading} 
            />
          </div>
        </div>

        {/* Account & Settings Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">Account & Settings</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PasswordChangeCard />
            <DocsCard />
          </div>
        </div>
      </main>
    </div>
  );
}
