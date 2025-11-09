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
import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { KanbanBoard } from "@/components/kanban-board";
import { AircraftTable } from "@/components/aircraft-table";
import { MaintenanceList } from "@/components/maintenance-list";
import { ClientsTable } from "@/components/clients-table";
import type { ServiceRequest, ServiceRequestUpdate, ServiceStatus } from "@/lib/types/database";

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

type StaffServiceRequest = ServiceRequest & {
  aircraft?: { tail_number?: string | null } | null;
  owner?: { full_name?: string | null; email?: string | null } | null;
  assigned_to?: string | null;
};

type ServicePriorityOption = "low" | "medium" | "high" | "__none__";

type SortDirection = "asc" | "desc";

type ServiceRequestSortField =
  | "created_at"
  | "requested_departure"
  | "tail_number"
  | "owner"
  | "service_type"
  | "priority";

const SERVICE_REQUEST_SORT_FIELDS: Array<{ value: ServiceRequestSortField; label: string }> = [
  { value: "created_at", label: "Created Date" },
  { value: "requested_departure", label: "Requested Departure" },
  { value: "tail_number", label: "Aircraft" },
  { value: "owner", label: "Client" },
  { value: "service_type", label: "Service Type" },
  { value: "priority", label: "Priority" },
];

const SERVICE_REQUEST_SORT_DIRECTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const SERVICE_REQUEST_PRIORITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

type SortValue = string | number | null;

const getServiceRequestSortValue = (
  request: StaffServiceRequest | null | undefined,
  field: ServiceRequestSortField
): SortValue => {
  if (!request) return null;

  switch (field) {
    case "created_at": {
      if (!request.created_at) return null;
      const timestamp = Date.parse(request.created_at);
      return Number.isNaN(timestamp) ? null : timestamp;
    }
    case "requested_departure": {
      if (!request.requested_departure) return null;
      const timestamp = Date.parse(request.requested_departure);
      return Number.isNaN(timestamp) ? null : timestamp;
    }
    case "tail_number":
      return request.aircraft?.tail_number ? request.aircraft.tail_number.toLowerCase() : null;
    case "owner": {
      const ownerValue = request.owner?.full_name || request.owner?.email;
      return ownerValue ? ownerValue.toLowerCase() : null;
    }
    case "service_type":
      return request.service_type ? request.service_type.toLowerCase() : null;
    case "priority": {
      const priority = request.priority ? SERVICE_REQUEST_PRIORITY_ORDER[request.priority] : undefined;
      return typeof priority === "number" ? priority : null;
    }
    default:
      return null;
  }
};

const compareSortValues = (a: SortValue, b: SortValue, direction: SortDirection): number => {
  const normalizeNumber = (value: number | null): number | null => {
    if (value === null) return null;
    return Number.isNaN(value) ? null : value;
  };

  const valueA = typeof a === "number" ? normalizeNumber(a) : a;
  const valueB = typeof b === "number" ? normalizeNumber(b) : b;

  if (valueA === null && valueB === null) return 0;
  if (valueA === null) return 1;
  if (valueB === null) return -1;

  let comparison: number;

  if (typeof valueA === "number" && typeof valueB === "number") {
    comparison = valueA - valueB;
  } else {
    comparison = String(valueA).localeCompare(String(valueB), undefined, { sensitivity: "base" });
  }

  if (comparison === 0) return 0;
  return direction === "asc" ? comparison : -comparison;
};

interface EditServiceRequestFormState {
  status: ServiceStatus;
  priority: ServicePriorityOption;
  requestedDeparture: string;
  description: string;
}

const EDIT_SERVICE_REQUEST_FORM_INITIAL_STATE: EditServiceRequestFormState = {
  status: "pending",
  priority: "__none__",
  requestedDeparture: "",
  description: "",
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

const resolvePriorityValue = (value?: string | null): ServicePriorityOption => {
  return value === "low" || value === "medium" || value === "high" ? value : "__none__";
};

const INSTALL_DISMISSED_KEY = "faStaffInstallDismissed";

const isIos = () => {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

const isInStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const matchMediaAvailable = typeof window.matchMedia === "function";
  const displayModeStandalone = matchMediaAvailable ? window.matchMedia("(display-mode: standalone)").matches : false;
  return (typeof nav.standalone === "boolean" && nav.standalone) || displayModeStandalone;
};

const isSafari = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iP(ad|hone|od)/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);
  return isIOS && isWebkit && !isChrome && !isFirefox;
};

const isStaffInstallRoute = () => {
  if (typeof window === "undefined") return false;
  return window.location.pathname === "/staff";
};

const getInstallDismissed = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
};

const persistInstallDismissed = (value: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    } else {
      window.localStorage.removeItem(INSTALL_DISMISSED_KEY);
    }
  } catch {
    // Ignore storage write errors (e.g., private browsing)
  }
};

type UpdateServiceRequestVariables = {
  id: string;
  updates: Partial<ServiceRequestUpdate>;
  metadata?: {
    showSuccessToast?: boolean;
    successMessage?: string;
  };
};

export default function StaffDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDev = !import.meta.env.PROD;
  const isAuthenticated = Boolean(user?.id);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [hours, setHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("150");
  const [showPreview, setShowPreview] = useState(false);
  const [isServiceRequestDialogOpen, setIsServiceRequestDialogOpen] = useState(false);
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<StaffServiceRequest | null>(null);
  const [editServiceRequestForm, setEditServiceRequestForm] = useState<EditServiceRequestFormState>(EDIT_SERVICE_REQUEST_FORM_INITIAL_STATE);
  const [isInstallEligible, setIsInstallEligible] = useState(false);
  const [installBannerVisible, setInstallBannerVisible] = useState(false);
  const [serviceRequestSortField, setServiceRequestSortField] = useState<ServiceRequestSortField>("created_at");
  const [serviceRequestSortDirection, setServiceRequestSortDirection] = useState<SortDirection>("desc");

  const refreshInstallState = useCallback(() => {
    if (typeof window === "undefined") return;
    const eligible = isStaffInstallRoute() && isIos() && isSafari() && !isInStandaloneMode();
    setIsInstallEligible(eligible);
    if (!eligible) {
      setInstallBannerVisible(false);
      return;
    }
    setInstallBannerVisible(!getInstallDismissed());
  }, []);

  const handleCloseInstallBanner = useCallback(() => {
    persistInstallDismissed(true);
    setInstallBannerVisible(false);
    refreshInstallState();
  }, [refreshInstallState]);

  const handleOpenInstallHelp = useCallback(() => {
    if (!isInstallEligible) return;
    persistInstallDismissed(false);
    setInstallBannerVisible(true);
    refreshInstallState();
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const banner = document.getElementById("ios-install-banner");
        banner?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }, [isInstallEligible, refreshInstallState]);

  useEffect(() => {
    refreshInstallState();
    if (typeof window === "undefined") return;

    const handleFocus = () => refreshInstallState();
    const handleOrientationChange = () => refreshInstallState();
    const handlePageShow = () => refreshInstallState();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [refreshInstallState]);

  useEffect(() => {
    if (!selectedServiceRequest) {
      setEditServiceRequestForm(EDIT_SERVICE_REQUEST_FORM_INITIAL_STATE);
      return;
    }

    setEditServiceRequestForm({
      status: selectedServiceRequest.status,
      priority: resolvePriorityValue(selectedServiceRequest.priority),
      requestedDeparture: toDateTimeLocal(selectedServiceRequest.requested_departure),
      description: selectedServiceRequest.description ?? "",
    });
  }, [selectedServiceRequest]);


  // Fetch owners
  const { data: owners = [] } = useQuery({
    queryKey: ['/api/owners'],
    queryFn: async () => {
      if (!user) {
        if (!isDev) throw new Error('Not authenticated. Please log in to view owners.');
        return [];
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('role', 'owner')
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch aircraft for invoice dropdown
  const { data: aircraft = [] } = useQuery({
    queryKey: ['/api/aircraft'],
    queryFn: async () => {
      if (!user) {
        if (!isDev) throw new Error('Not authenticated. Please log in to view aircraft.');
        return [];
      }
      const { data, error } = await supabase
        .from('aircraft')
        .select('id, tail_number, owner_id')
        .order('tail_number');
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch aircraft with full details for the AircraftTable
  const { data: aircraftFull = [], isLoading: isLoadingAircraft, error: aircraftError } = useQuery({
    queryKey: ['/api/aircraft/full'],
    queryFn: async () => {
      if (!user) {
        if (!isDev) throw new Error('Not authenticated. Please log in to view aircraft.');
        return [];
      }
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
        return (data || []).map((ac: any) => ({
          id: ac.id,
          tailNumber: ac.tail_number,
          make: ac.make || 'N/A',
          model: ac.model || '',
          class: ac.class || 'Unknown',
          baseAirport: ac.base_location || 'KAPA',
          owner: ac.owner?.full_name || ac.owner?.email || 'Unknown Owner',
        }));
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
    enabled: isAuthenticated,
    retry: false,
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
  const {
    data: serviceRequests = [],
    refetch: refetchServiceRequests,
    error: serviceRequestsError,
    isLoading: isLoadingServiceRequests,
  } = useQuery<StaffServiceRequest[]>({
    queryKey: ['/api/service-requests'],
    queryFn: async (): Promise<StaffServiceRequest[]> => {
      if (!user) {
        if (!isDev) throw new Error('Not authenticated. Please log in to view service requests.');
        return [];
      }
      try {
        // First, try to fetch service requests with nested relations
        const normalizeRequestedDeparture = (records: any[] | null | undefined): StaffServiceRequest[] => {
          if (!records || records.length === 0) return [];

          return records.map((sr) => {
            if (!sr || !sr.requested_departure) return sr;

            const parsed = new Date(sr.requested_departure);
            if (Number.isNaN(parsed.getTime())) {
              return { ...sr, requested_departure: null } as StaffServiceRequest;
            }
            return { ...sr, requested_departure: parsed.toISOString() } as StaffServiceRequest;
          }) as StaffServiceRequest[];
        };

        let query = supabase
          .from('service_requests')
          .select('*, aircraft:aircraft_id(tail_number), owner:user_id(full_name, email)')
          .order('created_at', { ascending: false });

        let { data, error } = await query;
        
        // If nested query fails, try fetching separately
        if (error && (error.message?.includes('aircraft') || error.message?.includes('owner') || error.message?.includes('user_profiles'))) {
          console.warn('⚠️ Nested query failed, trying separate queries:', error.message);
          
          // Fetch service requests without nested relations
          const srResult = await supabase
            .from('service_requests')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (srResult.error) {
            console.error('❌ Error fetching service requests:', srResult.error);
            throw srResult.error;
          }
          
          const srData = srResult.data || [];
          
          // Get unique aircraft and user IDs
          const aircraftIds = [...new Set(srData.map((sr: any) => sr.aircraft_id).filter(Boolean))];
          const userIds = [...new Set(srData.map((sr: any) => sr.user_id).filter(Boolean))];
          
          // Fetch aircraft and owners separately
          const [aircraftResult, ownersResult] = await Promise.all([
            aircraftIds.length > 0
              ? supabase
                  .from('aircraft')
                  .select('id, tail_number')
                  .in('id', aircraftIds)
              : { data: [], error: null },
            userIds.length > 0
              ? supabase
                  .from('user_profiles')
                  .select('id, full_name, email')
                  .in('id', userIds)
              : { data: [], error: null },
          ]);
          
          // Create maps for quick lookup
          const aircraftMap = (aircraftResult.data || []).reduce((acc: any, ac: any) => {
            acc[ac.id] = { tail_number: ac.tail_number };
            return acc;
          }, {});
          
          const ownersMap = (ownersResult.data || []).reduce((acc: any, owner: any) => {
            acc[owner.id] = { full_name: owner.full_name, email: owner.email };
            return acc;
          }, {});
          
          // Combine data
          data = srData.map((sr: any) => ({
            ...sr,
            aircraft: aircraftMap[sr.aircraft_id] || null,
            owner: ownersMap[sr.user_id] || null,
          }));
          
          error = null; // Clear error since we successfully fetched
        }
        
        if (error) {
          console.error('❌ Error fetching service requests:', error);
          throw error;
        }

        return normalizeRequestedDeparture(data);
      } catch (err: any) {
        console.error('❌ Error in service requests query:', err);
        // Provide more helpful error message
        if (err.message?.includes('permission') || err.code === 'PGRST301') {
          throw new Error('Permission denied. Please check your authentication and ensure you have admin or staff role.');
        } else if (err.message?.includes('relation') || err.code === 'PGRST116') {
          throw new Error('Service requests table not found. Please ensure the database schema is set up correctly.');
        } else {
          throw err;
        }
      }
    },
    // Refetch every 30 seconds to catch new requests
    refetchInterval: 30000,
    enabled: isAuthenticated,
    retry: false,
  });

  const sortedServiceRequests = useMemo(() => {
    const availableRequests = serviceRequests.filter(
      (sr): sr is StaffServiceRequest => Boolean(sr && sr.id)
    );
    const requestsCopy = [...availableRequests];

    requestsCopy.sort((a, b) => {
      const primaryComparison = compareSortValues(
        getServiceRequestSortValue(a, serviceRequestSortField),
        getServiceRequestSortValue(b, serviceRequestSortField),
        serviceRequestSortDirection
      );

      if (primaryComparison !== 0) {
        return primaryComparison;
      }

      const createdAtComparison = compareSortValues(
        getServiceRequestSortValue(a, "created_at"),
        getServiceRequestSortValue(b, "created_at"),
        "desc"
      );

      if (createdAtComparison !== 0) {
        return createdAtComparison;
      }

      return (a.id || "").localeCompare(b.id || "");
    });

    return requestsCopy;
  }, [serviceRequests, serviceRequestSortField, serviceRequestSortDirection]);

  const updateServiceRequestMutation = useMutation<
    ServiceRequest,
    Error,
    UpdateServiceRequestVariables
  >({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ServiceRequest;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'service-requests' || query.queryKey[0] === '/api/service-requests',
      });
      await refetchServiceRequests();

      if (variables.metadata?.showSuccessToast) {
        toast({
          title: 'Service request updated',
          description: variables.metadata.successMessage ?? 'Changes saved successfully.',
        });
      }
    },
  });

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

  const handleServiceRequestDialogChange = (open: boolean) => {
    setIsServiceRequestDialogOpen(open);
    if (!open) {
      setSelectedServiceRequest(null);
    }
  };

  const handleSelectServiceRequest = (requestId: string) => {
    const request = serviceRequests.find((sr) => sr.id === requestId);
    if (!request) return;

    setSelectedServiceRequest(request);
    setIsServiceRequestDialogOpen(true);
  };

  const handleStatusChange = async (requestId: string, status: "pending" | "in_progress" | "completed") => {
    await updateServiceRequestMutation.mutateAsync({
      id: requestId,
      updates: { status },
      metadata: { showSuccessToast: false },
    });

    setSelectedServiceRequest((prev) =>
      prev && prev.id === requestId ? { ...prev, status } : prev
    );
  };

  const handleServiceRequestUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedServiceRequest) return;

    const updates: Partial<ServiceRequestUpdate> = {
      status: editServiceRequestForm.status,
      description: editServiceRequestForm.description,
      requested_departure: editServiceRequestForm.requestedDeparture
        ? new Date(editServiceRequestForm.requestedDeparture).toISOString()
        : null,
    };

    updates.priority = editServiceRequestForm.priority === "__none__"
      ? null
      : editServiceRequestForm.priority;

    try {
      const updated = await updateServiceRequestMutation.mutateAsync({
        id: selectedServiceRequest.id,
        updates,
        metadata: {
          showSuccessToast: true,
          successMessage: "Service request updated successfully.",
        },
      });

      setSelectedServiceRequest((prev) =>
        prev ? { ...prev, ...updated } : prev
      );
      handleServiceRequestDialogChange(false);
    } catch (error: any) {
      console.error("Error updating service request:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update service request.",
        variant: "destructive",
      });
    }
  };

  // Fetch maintenance items
  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      if (!user) {
        if (!isDev) throw new Error('Not authenticated. Please log in to view maintenance items.');
        return [];
      }
      const { data, error } = await supabase
        .from('maintenance_due')
        .select(`
          id,
          aircraft_id,
          item,
          due_at_date,
          due_at_hours,
          severity,
          remaining_hours,
          remaining_days,
          aircraft:aircraft_id(tail_number)
        `)
        .order('due_at_date', { ascending: true });
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
        
        // Add hobbs_hours to each maintenance item
        return data.map((m: any) => ({
          ...m,
          aircraft: m.aircraft ? {
            ...m.aircraft,
            hobbs_hours: hobbsMap[m.aircraft_id] || null
          } : null
        }));
      }
      
      return data || [];
    },
    enabled: isAuthenticated,
    retry: false,
  });

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
          <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Freedom Aviation" className="h-8 w-auto" />
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Freedom Aviation - Staff</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Staff Dashboard</h2>
              <p className="text-muted-foreground">Manage service requests, aircraft, maintenance, and invoices</p>
            </div>
            {isInstallEligible && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenInstallHelp}
                className="w-full sm:w-auto"
                data-testid="button-install-on-iphone"
              >
                Install on iPhone
              </Button>
            )}
          </div>

          <Tabs defaultValue="invoices" className="space-y-6">
            <TabsList className="flex w-full flex-wrap gap-2 overflow-x-auto sm:grid sm:grid-cols-4 sm:gap-2 lg:grid-cols-7">
              <TabsTrigger value="requests" data-testid="tab-requests" className="flex-1 min-w-[140px] text-xs sm:text-sm">
                Service Requests
              </TabsTrigger>
              <TabsTrigger value="aircraft" data-testid="tab-aircraft" className="flex-1 min-w-[140px] text-xs sm:text-sm">
                Aircraft
              </TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance" className="flex-1 min-w-[140px] text-xs sm:text-sm">
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="clients" data-testid="tab-clients" className="flex-1 min-w-[140px] text-xs sm:text-sm">
                Clients
              </TabsTrigger>
              <TabsTrigger value="schedule" data-testid="tab-schedule" className="flex-1 min-w-[140px] text-xs sm:text-sm">
                Schedule
              </TabsTrigger>
              <TabsTrigger value="logs" data-testid="tab-logs" className="flex-1 min-w-[140px] text-xs sm:text-sm">
                Flight Logs
              </TabsTrigger>
              <TabsTrigger value="invoices" data-testid="tab-invoices" className="flex-1 min-w-[140px] text-xs sm:text-sm">
                Invoices
              </TabsTrigger>
            </TabsList>

          {/* Service Requests */}
          <TabsContent value="requests" className="space-y-6">
            <Dialog open={isServiceRequestDialogOpen} onOpenChange={handleServiceRequestDialogChange}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Edit Service Request</DialogTitle>
                  <DialogDescription>
                    Update status, priority, scheduling details, and notes for this service request.
                  </DialogDescription>
                </DialogHeader>
                {selectedServiceRequest ? (
                  <form onSubmit={handleServiceRequestUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Owner</p>
                        <p className="text-sm font-semibold">
                          {selectedServiceRequest.owner?.full_name || selectedServiceRequest.owner?.email || 'Unknown owner'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Aircraft</p>
                        <p className="text-sm font-mono font-semibold">
                          {selectedServiceRequest.aircraft?.tail_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Service Type</p>
                        <p className="text-sm font-semibold">{selectedServiceRequest.service_type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Created</p>
                        <p className="text-sm">
                          {selectedServiceRequest.created_at
                            ? format(new Date(selectedServiceRequest.created_at), 'MMM d, yyyy HH:mm')
                            : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service-request-status">Status</Label>
                        <Select
                          value={editServiceRequestForm.status}
                          onValueChange={(value) =>
                            setEditServiceRequestForm((prev) => ({
                              ...prev,
                              status: value as ServiceStatus,
                            }))
                          }
                        >
                          <SelectTrigger id="service-request-status" data-testid="select-service-request-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-request-priority">Priority</Label>
                        <Select
                          value={editServiceRequestForm.priority}
                          onValueChange={(value) =>
                            setEditServiceRequestForm((prev) => ({
                              ...prev,
                              priority: value as ServicePriorityOption,
                            }))
                          }
                        >
                          <SelectTrigger id="service-request-priority" data-testid="select-service-request-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Not set</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-request-requested-departure">Requested Departure</Label>
                      <Input
                        id="service-request-requested-departure"
                        type="datetime-local"
                        value={editServiceRequestForm.requestedDeparture}
                        onChange={(event) =>
                          setEditServiceRequestForm((prev) => ({
                            ...prev,
                            requestedDeparture: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-request-description">Notes</Label>
                      <Textarea
                        id="service-request-description"
                        rows={4}
                        value={editServiceRequestForm.description}
                        onChange={(event) =>
                          setEditServiceRequestForm((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Add internal notes or update the request description"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleServiceRequestDialogChange(false)}
                        disabled={updateServiceRequestMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateServiceRequestMutation.isPending}
                        data-testid="button-save-service-request"
                      >
                        {updateServiceRequestMutation.isPending ? 'Saving...' : 'Save changes'}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="py-6">
                    <p className="text-sm text-muted-foreground">No service request selected.</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <Badge variant="secondary" className="text-sm">
                    {serviceRequests.length} total
                  </Badge>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="service-request-sort-field"
                        className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                      >
                        Sort by
                      </Label>
                      <Select
                        value={serviceRequestSortField}
                        onValueChange={(value) => setServiceRequestSortField(value as ServiceRequestSortField)}
                      >
                        <SelectTrigger id="service-request-sort-field" className="w-[190px]">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_REQUEST_SORT_FIELDS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="service-request-sort-direction"
                        className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                      >
                        Order
                      </Label>
                      <Select
                        value={serviceRequestSortDirection}
                        onValueChange={(value) => setServiceRequestSortDirection(value as SortDirection)}
                      >
                        <SelectTrigger id="service-request-sort-direction" className="w-[140px]">
                          <SelectValue placeholder="Select order" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_REQUEST_SORT_DIRECTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
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
              <KanbanBoard
                items={sortedServiceRequests.map((sr) => {
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
                onCardSelect={handleSelectServiceRequest}
                onStatusChange={handleStatusChange}
              />
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

            {/* Instruction Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Flight Instruction Requests</CardTitle>
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
                      const aTime = a.requested_departure ? new Date(a.requested_departure).getTime() : null;
                      const bTime = b.requested_departure ? new Date(b.requested_departure).getTime() : null;

                      if (aTime === null && bTime === null) {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      }
                      if (aTime === null) return 1;
                      if (bTime === null) return -1;
                      return aTime - bTime;
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
                        const isAssigned = request.assigned_to === user?.id;
                        const isAssignedToOther = request.assigned_to && request.assigned_to !== user?.id;
                        
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
                                  
                                  {request.requested_departure && (
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(request.requested_departure).toLocaleDateString()}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        {new Date(request.requested_departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {request.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {request.description}
                                    </p>
                                  )}
                                  
                                  {request.cabin_provisioning && (
                                    <p className="text-sm text-muted-foreground italic">
                                      Provisioning: {typeof request.cabin_provisioning === "string"
                                        ? request.cabin_provisioning
                                        : request.cabin_provisioning?.notes || JSON.stringify(request.cabin_provisioning)}
                                    </p>
                                  )}
                                  
                                  <div className="text-xs text-muted-foreground">
                                    Requested: {new Date(request.created_at).toLocaleString()}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                  {!request.assigned_to && (
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from('service_requests')
                                            .update({ assigned_to: user?.id, status: 'in_progress' })
                                            .eq('id', request.id);
                                          
                                          if (error) throw error;
                                          
                                          toast({
                                            title: "Success",
                                            description: "You've been assigned to this instruction request.",
                                          });
                                          
                                          // Invalidate all service request queries to refresh
                                          await queryClient.invalidateQueries({
                                            predicate: (query) => 
                                              query.queryKey[0] === "service-requests" || 
                                              query.queryKey[0] === "/api/service-requests"
                                          });
                                          await refetchServiceRequests();
                                        } catch (error: any) {
                                          console.error("Error assigning request:", error);
                                          toast({
                                            title: "Error",
                                            description: error.message || "Failed to assign request",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      Assign to Me
                                    </Button>
                                  )}
                                  
                                  {isAssigned && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from('service_requests')
                                            .update({ assigned_to: null, status: 'pending' })
                                            .eq('id', request.id);
                                          
                                          if (error) throw error;
                                          
                                          toast({
                                            title: "Success",
                                            description: "Assignment removed.",
                                          });
                                          
                                          // Invalidate all service request queries to refresh
                                          await queryClient.invalidateQueries({
                                            predicate: (query) => 
                                              query.queryKey[0] === "service-requests" || 
                                              query.queryKey[0] === "/api/service-requests"
                                          });
                                          await refetchServiceRequests();
                                        } catch (error: any) {
                                          console.error("Error unassigning request:", error);
                                          toast({
                                            title: "Error",
                                            description: error.message || "Failed to unassign request",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      Unassign
                                    </Button>
                                  )}
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
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Flight logs functionality coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                      <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                        <SelectTrigger id="owner" data-testid="select-owner">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners
                            .filter((owner: any) => owner && owner.id)
                            .map((owner: any) => (
                              <SelectItem key={owner.id} value={owner.id}>
                                {owner.full_name || owner.email}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </Tabs>
        </div>
      </main>

      {isInstallEligible && (
        <div
          id="ios-install-banner"
          role="dialog"
          aria-label="Install FA Staff on iPhone"
          aria-live="polite"
          className={cn(
            "pointer-events-none fixed inset-x-4 bottom-4 z-[9999] transform rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl transition-all duration-300 sm:left-1/2 sm:bottom-6 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:inset-x-auto",
            installBannerVisible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="flex-1 space-y-2 text-sm leading-relaxed">
              <strong className="text-base font-semibold">Install “FA Staff”</strong>
              <p>
                On iPhone: tap the{" "}
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[0.65rem] font-semibold uppercase tracking-wide">
                  Share
                </span>{" "}
                button in Safari, then choose <span className="font-semibold">Add to Home Screen</span>.
              </p>
            </div>
            <button
              type="button"
              className="ml-2 text-lg text-white/70 transition hover:text-white"
              aria-label="Dismiss install tip"
              onClick={handleCloseInstallBanner}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
