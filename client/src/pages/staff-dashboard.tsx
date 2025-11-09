import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  DollarSign,
  Plane,
  Users,
  Wrench,
} from "lucide-react";
import { differenceInDays, format, isValid, parseISO } from "date-fns";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type StaffServiceRequest = {
  id: string;
  created_at: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  service_type: string | null;
  requested_departure: string | null;
  priority: string | null;
  description: string | null;
  aircraft?: { tail_number?: string | null } | null;
  owner?: { full_name?: string | null; email?: string | null } | null;
};

type MaintenanceItem = {
  id: string;
  item: string;
  due_at_date: string | null;
  due_at_hours: number | null;
  remaining_hours: number | null;
  remaining_days: number | null;
  severity: string | null;
  aircraft?: { tail_number?: string | null } | null;
};

type InstructionInvoice = {
  id: string;
  owner?: { full_name?: string | null; email?: string | null } | null;
  aircraft?: { tail_number?: string | null } | null;
  invoice_number: string | null;
  status: string;
  amount: number;
  created_at: string | null;
  due_date: string | null;
  paid_date?: string | null;
  invoice_lines?: Array<{
    description: string;
    quantity: number;
    unit_cents: number;
  }>;
};

const QUICK_LINKS = [
  { label: "Service Requests", href: "/staff/operations" },
  { label: "Members", href: "/staff/members" },
  { label: "Aircraft", href: "/staff/aircraft" },
  { label: "Maintenance", href: "/staff/operations?tab=maintenance" },
  { label: "Invoices", href: "/staff/operations?tab=invoices" },
] as const;

const REQUEST_STATUS_VARIANT: Record<StaffServiceRequest["status"], "default" | "secondary" | "outline"> = {
  pending: "secondary",
  in_progress: "default",
  completed: "outline",
  cancelled: "outline",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const parseDateMaybe = (value: string | null) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

const normalizeRequestedDeparture = (records: any[] | null | undefined): StaffServiceRequest[] => {
  if (!records || records.length === 0) return [];

  return records.map((sr) => {
    if (!sr) return sr;
    const parsed = parseDateMaybe(sr.requested_departure);
    return {
      ...sr,
      requested_departure: parsed ? parsed.toISOString() : null,
    } as StaffServiceRequest;
  });
};

const getInvoiceTotal = (invoice: InstructionInvoice): number => {
  if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
    return invoice.invoice_lines.reduce((sum, line) => sum + (line.quantity * line.unit_cents) / 100, 0);
  }

  return typeof invoice.amount === "number" ? invoice.amount : 0;
};

const isMaintenanceDueSoon = (item: MaintenanceItem): boolean => {
  if (!item) return false;
  if (item.severity && ["high", "critical"].includes(item.severity)) return true;
  if (typeof item.remaining_days === "number") return item.remaining_days <= 30;
  if (typeof item.remaining_hours === "number") return item.remaining_hours <= 10;

  if (item.due_at_date) {
    const dueDate = parseDateMaybe(item.due_at_date);
    if (dueDate) {
      return differenceInDays(dueDate, new Date()) <= 30;
    }
  }

  return false;
};

const getRequestedDepartureLabel = (value: string | null) => {
  const parsed = parseDateMaybe(value);
  return parsed ? format(parsed, "MMM d, yyyy · HH:mm") : "No departure set";
};

const getInvoiceStatusDescription = (invoice: InstructionInvoice) => {
  if (invoice.status === "paid" && invoice.paid_date) {
    const paidDate = parseDateMaybe(invoice.paid_date);
    return paidDate ? `Paid ${format(paidDate, "MMM d, yyyy")}` : "Paid";
  }

  if (invoice.status === "finalized" && invoice.due_date) {
    const dueDate = parseDateMaybe(invoice.due_date);
    return dueDate ? `Due ${format(dueDate, "MMM d")}` : "Finalized";
  }

  return invoice.status;
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const isDev = !import.meta.env.PROD;
  const isAuthenticated = Boolean(user?.id);
  const queriesEnabled = isAuthenticated || isDev;

  const {
    data: serviceRequests = [],
    isLoading: isLoadingServiceRequests,
    error: serviceRequestsError,
  } = useQuery<StaffServiceRequest[]>({
    queryKey: ["staff-service-requests", user?.id],
    enabled: queriesEnabled,
    retry: false,
    queryFn: async () => {
      if (!user) {
        if (!isDev) throw new Error("Not authenticated. Please log in to view service requests.");
        return [];
      }

      try {
        let { data, error } = await supabase
          .from("service_requests")
          .select(
            `
              id,
              created_at,
              status,
              service_type,
              requested_departure,
              priority,
              description,
              aircraft:aircraft_id(tail_number),
              owner:user_id(full_name, email)
            `
          )
          .order("created_at", { ascending: false });

        if (error && (error.message?.includes("aircraft") || error.message?.includes("owner"))) {
          const baseResult = await supabase
            .from("service_requests")
            .select("id, created_at, status, service_type, requested_departure, priority, description, aircraft_id, user_id")
            .order("created_at", { ascending: false });

          if (baseResult.error) throw baseResult.error;

          const srData = baseResult.data || [];
          const aircraftIds = [...new Set(srData.map((sr) => sr.aircraft_id).filter(Boolean))];
          const ownerIds = [...new Set(srData.map((sr) => sr.user_id).filter(Boolean))];

          const [aircraftResult, ownerResult] = await Promise.all([
            aircraftIds.length > 0
              ? supabase.from("aircraft").select("id, tail_number").in("id", aircraftIds)
              : Promise.resolve({ data: [], error: null }),
            ownerIds.length > 0
              ? supabase.from("user_profiles").select("id, full_name, email").in("id", ownerIds)
              : Promise.resolve({ data: [], error: null }),
          ]);

          const aircraftMap = (aircraftResult.data || []).reduce<Record<string, { tail_number?: string | null }>>((acc, aircraft) => {
            acc[aircraft.id] = { tail_number: aircraft.tail_number };
            return acc;
          }, {});

          const ownerMap = (ownerResult.data || []).reduce<Record<string, { full_name?: string | null; email?: string | null }>>((acc, owner) => {
            acc[owner.id] = { full_name: owner.full_name, email: owner.email };
            return acc;
          }, {});

          data = srData.map((sr) => ({
            id: sr.id,
            created_at: sr.created_at,
            status: sr.status,
            service_type: sr.service_type,
            requested_departure: sr.requested_departure,
            priority: sr.priority,
            description: sr.description,
            aircraft: sr.aircraft_id ? aircraftMap[sr.aircraft_id] || null : null,
            owner: sr.user_id ? ownerMap[sr.user_id] || null : null,
          }));

          error = null;
        }

        if (error) throw error;
        return normalizeRequestedDeparture(data);
      } catch (err: any) {
        if (err?.message?.includes("permission") || err?.code === "PGRST301") {
          throw new Error("Permission denied. Please ensure you are signed in as staff.");
        }

        if (err?.message?.includes("relation") || err?.code === "PGRST116") {
          throw new Error("Service requests table not found. Verify database setup.");
        }

        throw err;
      }
    },
  });

  const {
    data: aircraft = [],
    isLoading: isLoadingAircraft,
    error: aircraftError,
  } = useQuery({
    queryKey: ["staff-aircraft", user?.id],
    enabled: queriesEnabled,
    retry: false,
    queryFn: async () => {
      if (!user) {
        if (!isDev) throw new Error("Not authenticated. Please log in to view aircraft.");
        return [];
      }

      const { data, error } = await supabase
        .from("aircraft")
        .select("id, tail_number, owner_id")
        .order("tail_number");

      if (error) throw error;
      return data || [];
    },
  });

  const {
    data: maintenanceItems = [],
    isLoading: isLoadingMaintenance,
    error: maintenanceError,
  } = useQuery<MaintenanceItem[]>({
    queryKey: ["staff-maintenance", user?.id],
    enabled: queriesEnabled,
    retry: false,
    queryFn: async () => {
      if (!user) {
        if (!isDev) throw new Error("Not authenticated. Please log in to view maintenance.");
        return [];
      }

      const { data, error } = await supabase
        .from("maintenance_due")
        .select(
          `
            id,
            item,
            due_at_date,
            due_at_hours,
            remaining_hours,
            remaining_days,
            severity,
            aircraft:aircraft_id(tail_number)
          `
        )
        .order("due_at_date", { ascending: true });

      if (error) throw error;
      return (data || []) as MaintenanceItem[];
    },
  });

  const {
    data: invoices = [],
    isLoading: isLoadingInvoices,
    error: invoicesError,
  } = useQuery<InstructionInvoice[]>({
    queryKey: ["staff-invoices", user?.id],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated. Please log in to view invoices.");

      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
            id,
            invoice_number,
            status,
            amount,
            created_at,
            due_date,
            paid_date,
            aircraft:aircraft_id(tail_number),
            owner:owner_id(full_name, email),
            invoice_lines(description, quantity, unit_cents)
          `
        )
        .eq("category", "instruction")
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return (data || []) as InstructionInvoice[];
    },
  });

  useEffect(() => {
    if (serviceRequestsError) {
      toast({
        title: "Unable to load service requests",
        description: serviceRequestsError instanceof Error ? serviceRequestsError.message : "Please try again later.",
        variant: "destructive",
      });
    }
  }, [serviceRequestsError, toast]);

  useEffect(() => {
    if (aircraftError) {
      toast({
        title: "Unable to load aircraft",
        description: aircraftError instanceof Error ? aircraftError.message : "Please try again later.",
        variant: "destructive",
      });
    }
  }, [aircraftError, toast]);

  useEffect(() => {
    if (maintenanceError) {
      toast({
        title: "Unable to load maintenance items",
        description: maintenanceError instanceof Error ? maintenanceError.message : "Please try again later.",
        variant: "destructive",
      });
    }
  }, [maintenanceError, toast]);

  useEffect(() => {
    if (invoicesError) {
      toast({
        title: "Unable to load invoices",
        description: invoicesError instanceof Error ? invoicesError.message : "Please try again later.",
        variant: "destructive",
      });
    }
  }, [invoicesError, toast]);

  const summaryCards = useMemo(() => {
    const openRequests = serviceRequests.filter((request) => request.status === "pending" || request.status === "in_progress");
    const dueSoonMaintenanceCount = maintenanceItems.filter(isMaintenanceDueSoon).length;
    const outstandingInvoices = invoices.filter((invoice) => invoice.status !== "paid");
    const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0);

    return [
      {
        title: "Open Service Requests",
        value: openRequests.length,
        description: `${serviceRequests.length} total · ${serviceRequests.filter((sr) => sr.status === "pending").length} waiting`,
        icon: ClipboardList,
      },
      {
        title: "Active Aircraft",
        value: aircraft.length,
        description: isLoadingAircraft ? "Loading fleet..." : `${aircraft.length} tracked in fleet`,
        icon: Plane,
      },
      {
        title: "Maintenance Alerts",
        value: dueSoonMaintenanceCount,
        description: `${maintenanceItems.length} tracked items`,
        icon: Wrench,
      },
      {
        title: "Outstanding Invoices",
        value: outstandingInvoices.length,
        description: `${currencyFormatter.format(outstandingTotal)} in progress`,
        icon: DollarSign,
      },
    ];
  }, [aircraft.length, invoices, maintenanceItems, serviceRequests, isLoadingAircraft]);

  const recentRequests = useMemo(() => {
    return [...serviceRequests]
      .sort((a, b) => {
        const aDate = parseDateMaybe(a.created_at) ?? new Date(0);
        const bDate = parseDateMaybe(b.created_at) ?? new Date(0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [serviceRequests]);

  const dueSoonMaintenance = useMemo(() => {
    return maintenanceItems
      .filter(isMaintenanceDueSoon)
      .slice(0, 5);
  }, [maintenanceItems]);

  const recentInvoices = useMemo(() => {
    return invoices.slice(0, 5);
  }, [invoices]);

  const isLoadingSummary = isLoadingServiceRequests || isLoadingAircraft || isLoadingMaintenance || isLoadingInvoices;

  return (
    <DashboardLayout
      title="Staff Dashboard"
      description="Quick overview of service requests, maintenance, and billing"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plane className="h-4 w-4 text-primary" />
              <span>Freedom Aviation · Staff</span>
            </div>
            <CardTitle className="text-3xl font-semibold">Welcome back</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stay on top of owner requests, maintenance timelines, and instruction billing in one glance.
            </p>
          </div>
        </header>

        <section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.title} className="shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{card.title}</CardTitle>
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-semibold tracking-tight">
                    {isLoadingSummary ? "—" : card.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Quick Links
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Jump directly into detailed workflows when you need more than the overview.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {QUICK_LINKS.map((link) => (
                  <Button key={link.href} variant="secondary" size="sm" asChild>
                    <Link href={link.href}>
                      <span className="flex items-center gap-2">
                        {link.label}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Recent Service Requests
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  The five most recent owner requests and their current status.
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingServiceRequests ? (
                  <p className="text-sm text-muted-foreground">Loading service requests…</p>
                ) : recentRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No service requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-lg border bg-muted/40 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {request.owner?.full_name || request.owner?.email || "Unknown owner"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.service_type || "General request"} ·{" "}
                              {request.aircraft?.tail_number || "No aircraft assigned"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRequestedDepartureLabel(request.requested_departure)}
                            </p>
                          </div>
                          <Badge variant={REQUEST_STATUS_VARIANT[request.status]}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {request.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  Upcoming Maintenance
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Maintenance items approaching their limits or flagged as high priority.
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingMaintenance ? (
                  <p className="text-sm text-muted-foreground">Tracking maintenance…</p>
                ) : dueSoonMaintenance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming maintenance alerts.</p>
                ) : (
                  <div className="space-y-3">
                    {dueSoonMaintenance.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.item}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.aircraft?.tail_number || "Fleet item"}
                            </p>
                          </div>
                          <Badge variant="secondary">Due Soon</Badge>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          {item.due_at_date && (() => {
                            const dueDate = parseDateMaybe(item.due_at_date);
                            if (!dueDate) return null;
                            return (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(dueDate, "MMM d, yyyy")}
                              </span>
                            );
                          })()}
                          {typeof item.due_at_hours === "number" && (
                            <span>Hobbs {item.due_at_hours}</span>
                          )}
                          {typeof item.remaining_days === "number" && (
                            <span>{item.remaining_days} days remaining</span>
                          )}
                          {typeof item.remaining_hours === "number" && (
                            <span>{item.remaining_hours} hrs remaining</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Recent Instruction Invoices
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Track the latest instruction invoices and confirm payment status quickly.
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <p className="text-sm text-muted-foreground">Loading invoices…</p>
              ) : recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No instruction invoices yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => {
                    const total = getInvoiceTotal(invoice);
                    return (
                      <div key={invoice.id} className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {invoice.owner?.full_name || invoice.owner?.email || "Unknown client"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.aircraft?.tail_number || "No aircraft"} · Invoice {invoice.invoice_number || "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {currencyFormatter.format(total)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {getInvoiceStatusDescription(invoice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}

