import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plane, 
  DollarSign, 
  Users, 
  ArrowRight,
  Plus,
  Check,
  MoreHorizontal,
  Search,
  AlertCircle
} from "lucide-react";
import logoImage from "@assets/falogo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Link, useLocation } from "wouter";
import { format, subDays, startOfMonth } from "date-fns";
import { NotificationCenter } from "@/components/notification-center";
import { useToast } from "@/hooks/use-toast";

export default function StaffHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state for Quick Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: "",
    aircraftId: "",
    description: "Flight Instruction",
    hours: "1.5",
    rate: "100",
    date: format(new Date(), "yyyy-MM-dd")
  });

  // --- 1. DATA FETCHING ---

  // Fetch KPI Stats
  const { data: stats } = useQuery({
    queryKey: ['cockpit-stats'],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = startOfMonth(now).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [invoices, owners] = await Promise.all([
        supabase.from('invoices').select('amount, status, created_at').gte('created_at', thirtyDaysAgo),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner')
      ]);

      const invData = invoices.data || [];
      const unpaidCount = invData.filter(i => i.status === 'sent' || i.status === 'finalized').length;
      const totalRevenue = invData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const paidCount = invData.filter(i => i.status === 'paid').length;
      const collectionRate = invData.length > 0 ? (paidCount / invData.length) * 100 : 0;

      return {
        unpaidCount,
        monthlyRevenue: totalRevenue,
        collectionRate,
        activeStudents: owners.count || 0
      };
    },
    refetchInterval: 30000
  });

  // Fetch Form Data (Clients & Aircraft)
  const { data: formOptions } = useQuery({
    queryKey: ['invoice-form-options'],
    queryFn: async () => {
      const [clients, aircraft] = await Promise.all([
        supabase.from('user_profiles').select('id, full_name, email').eq('role', 'owner').order('full_name'),
        supabase.from('aircraft').select('id, tail_number').eq('status', 'active')
      ]);
      return { clients: clients.data || [], aircraft: aircraft.data || [] };
    }
  });

  // Fetch Recent Invoices (Ledger)
  const { data: ledger } = useQuery({
    queryKey: ['cockpit-ledger'],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select(`
          id, 
          created_at, 
          amount, 
          status, 
          description,
          client:user_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  // --- 2. ACTIONS ---

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!invoiceForm.clientId || !invoiceForm.rate || !invoiceForm.hours) throw new Error("Missing fields");
      
      const amount = parseFloat(invoiceForm.rate) * parseFloat(invoiceForm.hours);
      
      const { error } = await supabase.from('invoices').insert({
        user_id: invoiceForm.clientId,
        aircraft_id: invoiceForm.aircraftId || null,
        description: invoiceForm.description,
        amount: amount,
        status: 'sent', // Auto-send in this optimized workflow
        due_date: format(subDays(new Date(), -14), "yyyy-MM-dd"), // Net 14 default
        created_at: new Date().toISOString()
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invoice Sent", description: "Client has been billed successfully." });
      queryClient.invalidateQueries({ queryKey: ['cockpit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cockpit-ledger'] });
      // Reset logic could go here, but power users might want to retain settings
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    }
  });

  // --- 3. RENDER ---

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur z-50 sticky top-0">
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src={logoImage} alt="FA" className="h-6 w-auto" />
            </Link>
            <span className="text-sm font-semibold text-muted-foreground">/</span>
            <span className="font-semibold text-sm">Operations Cockpit</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 py-4 space-y-4">
        
        {/* TOP RIBBON: KPIs (Status Zone) */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="h-20 flex flex-col justify-center border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unpaid Invoices</p>
                <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  {stats?.unpaidCount || 0}
                  {stats?.unpaidCount ? <AlertCircle className="h-4 w-4" /> : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-20 flex flex-col justify-center border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">30d Revenue</p>
                <div className="text-2xl font-bold text-emerald-600">
                  ${stats?.monthlyRevenue?.toLocaleString() || "0"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-20 flex flex-col justify-center border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collection Rate</p>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.collectionRate?.toFixed(1) || "0"}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-20 flex flex-col justify-center border-l-4 border-l-slate-500 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Students</p>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {stats?.activeStudents || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MAIN COCKPIT: Asymmetric Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-180px)] min-h-[600px]">
          
          {/* LEFT PANEL: The "Action" Zone (30%) */}
          <Card className="lg:col-span-4 flex flex-col h-full border-t-4 border-t-primary shadow-md">
            <CardHeader className="pb-4 bg-muted/20 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-md">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Invoice</CardTitle>
                  <p className="text-xs text-muted-foreground">Bill flight time instantly</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-6">
              
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Student / Client</Label>
                <Select 
                  value={invoiceForm.clientId} 
                  onValueChange={(val) => setInvoiceForm({...invoiceForm, clientId: val})}
                >
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions?.clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Aircraft</Label>
                <Select 
                   value={invoiceForm.aircraftId} 
                   onValueChange={(val) => setInvoiceForm({...invoiceForm, aircraftId: val})}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select Aircraft (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions?.aircraft.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.tail_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">Flight Hours</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.1"
                      className="h-12 text-lg font-mono pl-3" 
                      value={invoiceForm.hours}
                      onChange={(e) => setInvoiceForm({...invoiceForm, hours: e.target.value})}
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-muted-foreground">HRS</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">Rate / Hr</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-muted-foreground">$</span>
                    <Input 
                      type="number" 
                      className="h-12 text-lg font-mono pl-7" 
                      value={invoiceForm.rate}
                      onChange={(e) => setInvoiceForm({...invoiceForm, rate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Description</Label>
                <Input 
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                  className="h-10"
                />
              </div>

              <div className="pt-4 mt-auto">
                <Button 
                  className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all" 
                  size="lg"
                  onClick={() => createInvoice.mutate()}
                  disabled={createInvoice.isPending || !invoiceForm.clientId}
                >
                  {createInvoice.isPending ? "Sending..." : "Send Invoice & Charge"}
                  {!createInvoice.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Invoices are automatically emailed to the client.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* RIGHT PANEL: The "Ledger" Zone (70%) */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-full">
            
            {/* Analytics Sparklines */}
            <div className="grid grid-cols-2 gap-4 h-[15%] min-h-[100px]">
               <Card className="flex flex-col justify-between p-4 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Revenue Trend (30d)</span>
                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">+12%</Badge>
                  </div>
                  {/* CSS-only Sparkline Simulation */}
                  <div className="flex items-end gap-1 h-12 mt-2">
                    {[40, 65, 45, 80, 55, 90, 75, 60, 85, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500 transition-colors rounded-t-sm" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
               </Card>
               <Card className="flex flex-col justify-between p-4 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Invoice Status</span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-xs">
                      <span>Paid</span>
                      <span className="font-mono">53.8%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 w-[54%]"></div>
                      <div className="h-full bg-orange-500 w-[30%]"></div>
                      <div className="h-full bg-red-500 w-[16%]"></div>
                    </div>
                    <div className="flex gap-4 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Paid</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Pending</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Overdue</div>
                    </div>
                  </div>
               </Card>
            </div>

            {/* Live Ledger Table */}
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between bg-muted/10">
                <CardTitle className="text-base">Recent Ledger</CardTitle>
                <Link href="/staff/console?tab=invoices">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">View All History</Button>
                </Link>
              </CardHeader>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 sticky top-0 z-10">
                    <tr className="border-b">
                      <th className="h-10 px-6 text-left font-medium text-muted-foreground w-[120px]">Date</th>
                      <th className="h-10 px-6 text-left font-medium text-muted-foreground">Client</th>
                      <th className="h-10 px-6 text-left font-medium text-muted-foreground">Description</th>
                      <th className="h-10 px-6 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="h-10 px-6 text-right font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger?.map((inv: any) => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                        <td className="p-4 px-6 font-mono text-xs text-muted-foreground">
                          {format(new Date(inv.created_at), "MMM dd")}
                        </td>
                        <td className="p-4 px-6 font-medium">
                          {inv.client?.full_name || "Unknown"}
                        </td>
                        <td className="p-4 px-6 text-muted-foreground">
                          {inv.description}
                        </td>
                        <td className="p-4 px-6 text-right font-mono">
                          ${inv.amount?.toFixed(2)}
                        </td>
                        <td className="p-4 px-6 text-right">
                          <Badge 
                            variant="outline" 
                            className={`
                              ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                              ${inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                              ${inv.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                            `}
                          >
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {!ledger?.length && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No recent invoices found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}