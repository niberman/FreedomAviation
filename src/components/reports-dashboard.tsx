import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Plane, 
  DollarSign,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  description?: string;
}

export function ReportsDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    switch (timeRange) {
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        start = startOfMonth(selectedMonth);
        end = endOfMonth(selectedMonth);
        break;
      case "quarter":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return { start, end };
  };

  const { start, end } = getDateRange();

  // Fetch service request metrics
  const { data: serviceMetrics } = useQuery({
    queryKey: ["service-metrics", timeRange, selectedMonth],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("service_requests")
        .select("id, status, created_at, service_type")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      
      if (error) throw error;
      
      const total = requests?.length || 0;
      const completed = requests?.filter(r => r.status === "completed").length || 0;
      const pending = requests?.filter(r => r.status === "pending").length || 0;
      const inProgress = requests?.filter(r => r.status === "in_progress").length || 0;
      
      // Count by type
      const byType = requests?.reduce((acc, req) => {
        acc[req.service_type] = (acc[req.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return {
        total,
        completed,
        pending,
        inProgress,
        completionRate: total > 0 ? (completed / total * 100) : 0,
        byType,
      };
    },
  });

  // Fetch flight hour metrics
  const { data: flightMetrics } = useQuery({
    queryKey: ["flight-metrics", timeRange, selectedMonth],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from("flight_logs")
        .select("id, flight_time_hours, aircraft_id, date")
        .gte("date", start.toISOString().split('T')[0])
        .lte("date", end.toISOString().split('T')[0]);
      
      if (error?.code === "42P01") {
        // Table doesn't exist
        return { totalHours: 0, flightCount: 0, uniqueAircraft: 0 };
      }
      if (error) throw error;
      
      const totalHours = logs?.reduce((sum, log) => sum + (log.flight_time_hours || 0), 0) || 0;
      const flightCount = logs?.length || 0;
      const uniqueAircraft = new Set(logs?.map(l => l.aircraft_id)).size;
      
      return {
        totalHours,
        flightCount,
        uniqueAircraft,
        avgHoursPerFlight: flightCount > 0 ? totalHours / flightCount : 0,
      };
    },
  });

  // Fetch invoice metrics
  const { data: invoiceMetrics } = useQuery({
    queryKey: ["invoice-metrics", timeRange, selectedMonth],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, amount, status, created_at, category")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      
      if (error) throw error;
      
      const total = invoices?.length || 0;
      const paid = invoices?.filter(i => i.status === "paid").length || 0;
      const totalAmount = invoices?.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0) || 0;
      const paidAmount = invoices
        ?.filter(i => i.status === "paid")
        .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0) || 0;
      
      return {
        total,
        paid,
        totalAmount,
        paidAmount,
        outstanding: totalAmount - paidAmount,
        paidRate: total > 0 ? (paid / total * 100) : 0,
      };
    },
  });

  // Fetch maintenance metrics
  const { data: maintenanceMetrics } = useQuery({
    queryKey: ["maintenance-metrics"],
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from("maintenance")
        .select("id, status, due_date, due_hobbs");
      
      if (error?.code === "42P01") {
        // Table doesn't exist
        return { total: 0, overdue: 0, dueSoon: 0, completed: 0 };
      }
      if (error) throw error;
      
      const total = items?.length || 0;
      const overdue = items?.filter(i => i.status === "overdue").length || 0;
      const dueSoon = items?.filter(i => i.status === "due_soon").length || 0;
      const completed = items?.filter(i => i.status === "completed").length || 0;
      
      return {
        total,
        overdue,
        dueSoon,
        completed,
        activeItems: total - completed,
      };
    },
  });

  // Fetch client metrics
  const { data: clientMetrics } = useQuery({
    queryKey: ["client-metrics", timeRange, selectedMonth],
    queryFn: async () => {
      // Get total clients
      const { data: allClients, error: allError } = await supabase
        .from("user_profiles")
        .select("id, created_at")
        .eq("role", "owner");
      
      if (allError) throw allError;
      
      // Get new clients in time range
      const newClients = allClients?.filter(c => 
        new Date(c.created_at) >= start && new Date(c.created_at) <= end
      ).length || 0;
      
      return {
        total: allClients?.length || 0,
        new: newClients,
      };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const metrics: MetricCard[] = [
    {
      title: "Service Requests",
      value: serviceMetrics?.total || 0,
      icon: Activity,
      description: `${serviceMetrics?.completed || 0} completed`,
    },
    {
      title: "Flight Hours",
      value: flightMetrics?.totalHours.toFixed(1) || "0",
      icon: Plane,
      description: `${flightMetrics?.flightCount || 0} flights`,
    },
    {
      title: "Revenue",
      value: formatCurrency(invoiceMetrics?.totalAmount || 0),
      icon: DollarSign,
      description: `${formatCurrency(invoiceMetrics?.paidAmount || 0)} collected`,
    },
    {
      title: "Active Clients",
      value: clientMetrics?.total || 0,
      icon: Users,
      description: `${clientMetrics?.new || 0} new this period`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>
                Key performance metrics and operational insights
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {metric.title}
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {metric.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="operations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="fleet">Fleet</TabsTrigger>
            </TabsList>

            {/* Operations Tab */}
            <TabsContent value="operations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Service Request Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Completed</span>
                        </div>
                        <span className="font-medium">{serviceMetrics?.completed || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">In Progress</span>
                        </div>
                        <span className="font-medium">{serviceMetrics?.inProgress || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm">Pending</span>
                        </div>
                        <span className="font-medium">{serviceMetrics?.pending || 0}</span>
                      </div>
                    </div>
                    {serviceMetrics && serviceMetrics.total > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Completion Rate</span>
                          <span className="font-medium text-green-600">
                            {formatPercentage(serviceMetrics.completionRate)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Service Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(serviceMetrics?.byType || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Invoiced</span>
                        <span className="font-medium">
                          {formatCurrency(invoiceMetrics?.totalAmount || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Collected</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(invoiceMetrics?.paidAmount || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Outstanding</span>
                        <span className="font-medium text-amber-600">
                          {formatCurrency(invoiceMetrics?.outstanding || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Collection Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold">
                        {formatPercentage(invoiceMetrics?.paidRate || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {invoiceMetrics?.paid || 0} of {invoiceMetrics?.total || 0} invoices paid
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Average Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold">
                        {formatCurrency(
                          invoiceMetrics && invoiceMetrics.total > 0
                            ? invoiceMetrics.totalAmount / invoiceMetrics.total
                            : 0
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Per invoice value
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Maintenance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm">Overdue</span>
                        </div>
                        <span className="font-medium text-red-600">
                          {maintenanceMetrics?.overdue || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-sm">Due Soon</span>
                        </div>
                        <span className="font-medium text-amber-600">
                          {maintenanceMetrics?.dueSoon || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Completed</span>
                        </div>
                        <span className="font-medium">{maintenanceMetrics?.completed || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Maintenance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold">
                        {maintenanceMetrics?.activeItems || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Active maintenance items
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total: {maintenanceMetrics?.total || 0} items tracked
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Fleet Tab */}
            <TabsContent value="fleet" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Flight Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold">
                        {flightMetrics?.totalHours.toFixed(1) || "0"}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Total flight hours
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {flightMetrics?.flightCount || 0} flights logged
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Fleet Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold">
                        {flightMetrics?.uniqueAircraft || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Aircraft flown
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg {flightMetrics?.avgHoursPerFlight?.toFixed(1) || "0"} hrs/flight
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Client Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold">
                        {clientMetrics?.total || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Active clients
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {clientMetrics?.new || 0} new this period
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}






