'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  ArrowRight,
  AlertCircle,
  Wrench,
  Plane,
  Settings2,
  Users,
  Pencil,
  Send,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/staff/kanban-board';
import { AircraftTable } from '@/components/staff/aircraft-table';
import { ClientsTable } from '@/components/staff/clients-table';
import { ServiceRequestEditDialog } from '@/components/staff/service-request-edit-dialog';
import { StaffManagement } from '@/components/staff/staff-management';
import { MaintenanceCRUD } from '@/components/staff/maintenance-crud';
import { useClients } from '@/hooks/useClients';
import { useAircraftTable } from '@/hooks/useAircraft';
import { useCombineInvoices, useUpdateInvoice } from '@/hooks/useInvoices';
import { useResendInvoice } from '@/hooks/useResendInvoice';
import { apiJson } from '@/lib/api-client';

interface EditableLineItem {
  id: string;
  description: string;
  quantity: string;
  rate: string;
}

const COMBINE_STATUSES = new Set(['draft', 'finalized', 'sent']);

function isLedgerInvoiceEligible(inv: { status?: string; paid_date?: string | null; batch_id?: string | null }) {
  if (inv.status === 'paid' || inv.paid_date) return false;
  if (!inv.status || !COMBINE_STATUSES.has(inv.status)) return false;
  if (inv.batch_id) return false;
  return true;
}

function canSelectLedgerRow(
  inv: { owner_id?: string | null; status?: string; paid_date?: string | null; batch_id?: string | null },
  selectedOwnerId: string | null,
) {
  if (!isLedgerInvoiceEligible(inv)) return false;
  if (selectedOwnerId && inv.owner_id !== selectedOwnerId) return false;
  return true;
}

export function StaffHomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  type CockpitToolTab = 'invoice' | 'requests' | 'aircraft' | 'maintenance' | 'clients' | 'staff';
  const [activeToolTab, setActiveToolTab] = useState<CockpitToolTab>('invoice');

  // Invoice edit dialog state
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [isInvoiceEditOpen, setIsInvoiceEditOpen] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editFlightDate, setEditFlightDate] = useState('');
  const [editHours, setEditHours] = useState('1');
  const [editRate, setEditRate] = useState('100');
  const [editNotes, setEditNotes] = useState('');
  const [editLineItems, setEditLineItems] = useState<EditableLineItem[]>([
    { id: '1', description: '', quantity: '1', rate: '0' },
  ]);

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());

  const updateInvoiceMutation = useUpdateInvoice();
  const combineInvoicesMutation = useCombineInvoices();
  const resendInvoiceMutation = useResendInvoice({
    invalidateQueryKeys: [['cockpit-ledger'], ['cockpit-stats']],
  });

  const clearInvoiceSelection = useCallback(() => setSelectedInvoiceIds(new Set()), []);

  const unsendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'draft' })
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfi-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['cockpit-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['cockpit-stats'] });
      toast({ title: 'Invoice unsent', description: 'Status set back to draft.' });
    },
    onError: (err: Error) => {
      toast({ variant: 'destructive', title: 'Failed to unsend', description: err.message });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfi-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['cockpit-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['cockpit-stats'] });
      toast({ title: 'Invoice deleted', description: 'Invoice has been removed.' });
    },
    onError: (err: Error) => {
      toast({ variant: 'destructive', title: 'Failed to delete', description: err.message });
    },
  });

  useEffect(() => {
    const requestedTool = searchParams.get('tool');
    if (requestedTool === 'requests' || requestedTool === 'aircraft' || requestedTool === 'maintenance' || requestedTool === 'clients' || requestedTool === 'staff') {
      setActiveToolTab(requestedTool);
    }
  }, [searchParams]);

  // Local state for Quick Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    aircraftId: '',
    description: 'Flight Instruction',
    hours: '1.5',
    rate: '100',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  // KPI time period: 7d, 30d, 90d, or all time
  type KpiPeriod = '7' | '30' | '90' | 'all';
  const [kpiPeriod, setKpiPeriod] = useState<KpiPeriod>('30');

  // --- 1. DATA FETCHING ---

  // Fetch KPI Stats
  const { data: stats } = useQuery({
    queryKey: ['cockpit-stats', kpiPeriod],
    queryFn: async () => {
      const now = new Date();

      let invoicesQuery = supabase
        .from('invoices')
        .select('amount, status, created_at')
        .in('category', ['instruction', 'maintenance']);

      if (kpiPeriod !== 'all') {
        const since = subDays(now, Number(kpiPeriod)).toISOString();
        invoicesQuery = invoicesQuery.gte('created_at', since);
      }

      const [invoices, owners] = await Promise.all([
        invoicesQuery,
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner'),
      ]);

      const invData = invoices.data || [];
      const unpaidCount = invData.filter(
        (i: any) => i.status === 'sent' || i.status === 'finalized' || i.status === 'overdue'
      ).length;
      const totalRevenue = invData.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
      const paidCount = invData.filter((i: any) => i.status === 'paid').length;
      const collectionRate = invData.length > 0 ? (paidCount / invData.length) * 100 : 0;

      return {
        unpaidCount,
        monthlyRevenue: totalRevenue,
        collectionRate,
        activeStudents: owners.count || 0,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch Form Data (Clients & Aircraft)
  const { data: formOptions } = useQuery({
    queryKey: ['invoice-form-options'],
    queryFn: async () => {
      const [clients, aircraft] = await Promise.all([
        supabase.from('user_profiles').select('id, full_name, email').eq('role', 'owner').order('full_name'),
        supabase.from('aircraft').select('id, tail_number').eq('status', 'active'),
      ]);
      return { clients: clients.data || [], aircraft: aircraft.data || [] };
    },
    enabled: !!user,
  });

  // Fetch Recent Invoices (Ledger)
  const { data: ledger } = useQuery({
    queryKey: ['cockpit-ledger'],
    queryFn: async () => {
      // Try nested join first (no 'description' col on invoices table)
      let { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          amount,
          status,
          category,
          invoice_number,
          owner_id,
          aircraft_id,
          batch_id,
          paid_date,
          owner:owner_id(full_name, email),
          invoice_lines(description, quantity, unit_cents)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) return data;

      // Fallback: fetch invoices + owners separately
      const fallback = await supabase
        .from('invoices')
        .select('id, created_at, amount, status, category, invoice_number, owner_id, aircraft_id, batch_id, paid_date')
        .order('created_at', { ascending: false })
        .limit(20);

      if (fallback.error) throw fallback.error;

      const invoiceData = fallback.data || [];
      if (invoiceData.length === 0) return [];

      // Fetch owners and line items separately
      const ownerIds = [...new Set(invoiceData.map((inv: any) => inv.owner_id).filter(Boolean))];
      const invoiceIds = invoiceData.map((inv: any) => inv.id);

      const [ownersResult, linesResult] = await Promise.all([
        ownerIds.length > 0
          ? supabase.from('user_profiles').select('id, full_name, email').in('id', ownerIds)
          : { data: [] },
        invoiceIds.length > 0
          ? supabase.from('invoice_lines').select('invoice_id, description, quantity, unit_cents').in('invoice_id', invoiceIds)
          : { data: [] },
      ]);

      const ownerById = (ownersResult.data || []).reduce((acc: any, o: any) => {
        acc[o.id] = o;
        return acc;
      }, {});

      const linesByInvoice = (linesResult.data || []).reduce((acc: any, l: any) => {
        if (!acc[l.invoice_id]) acc[l.invoice_id] = [];
        acc[l.invoice_id].push(l);
        return acc;
      }, {});

      return invoiceData.map((inv: any) => ({
        ...inv,
        owner: ownerById[inv.owner_id] || null,
        invoice_lines: linesByInvoice[inv.id] || [],
      }));
    },
    enabled: !!user,
  });

  const selectedInvoices = useMemo(
    () => (ledger ?? []).filter((inv: { id: string }) => selectedInvoiceIds.has(inv.id)),
    [ledger, selectedInvoiceIds],
  );

  const selectedOwnerId =
    selectedInvoices.length > 0 ? (selectedInvoices[0] as { owner_id?: string | null }).owner_id ?? null : null;

  const eligibleLedgerRows = useMemo(
    () => (ledger ?? []).filter((inv: any) => isLedgerInvoiceEligible(inv)),
    [ledger],
  );

  const rowsForBulkSelect = useMemo(() => {
    if (eligibleLedgerRows.length === 0) return [];
    const anchorOwner =
      selectedOwnerId ??
      (eligibleLedgerRows[0] as { owner_id?: string | null }).owner_id ??
      null;
    if (!anchorOwner) return [];
    return eligibleLedgerRows.filter((inv: any) => inv.owner_id === anchorOwner);
  }, [eligibleLedgerRows, selectedOwnerId]);

  const allBulkSelected =
    rowsForBulkSelect.length > 0 && rowsForBulkSelect.every((inv: any) => selectedInvoiceIds.has(inv.id));
  const someBulkSelected = rowsForBulkSelect.some((inv: any) => selectedInvoiceIds.has(inv.id));

  const selectedInvoicesTotal = useMemo(
    () => selectedInvoices.reduce((acc: number, inv: any) => acc + (Number(inv.amount) || 0), 0),
    [selectedInvoices],
  );

  const combineBlockReason = useMemo(() => {
    if (selectedInvoices.length < 2) return 'Select at least 2 invoices for the same client.';
    const owner = (selectedInvoices[0] as { owner_id?: string }).owner_id;
    if (!selectedInvoices.every((inv: any) => inv.owner_id === owner)) {
      return 'All selected invoices must belong to the same client.';
    }
    for (const inv of selectedInvoices as any[]) {
      if (inv.status === 'paid' || inv.paid_date) return 'Paid invoices cannot be combined.';
      if (!inv.status || !COMBINE_STATUSES.has(inv.status)) {
        return `Invoice ${inv.invoice_number ?? inv.id} cannot be combined (status ${inv.status ?? 'unknown'}).`;
      }
      if (inv.batch_id) return `Invoice ${inv.invoice_number ?? inv.id} is already part of a batch.`;
    }
    return null;
  }, [selectedInvoices]);

  const combineDisabled = combineInvoicesMutation.isPending || combineBlockReason !== null;

  const { data: owners = [], error: ownersError } = useClients();
  const { aircraftFull, error: aircraftError, isLoading: isLoadingAircraft } = useAircraftTable();

  useEffect(() => {
    if (ownersError) {
      toast({
        title: 'Error loading clients',
        description: ownersError instanceof Error ? ownersError.message : 'Failed to load clients.',
        variant: 'destructive',
      });
    }
  }, [ownersError, toast]);

  useEffect(() => {
    if (aircraftError) {
      toast({
        title: 'Error loading aircraft',
        description: aircraftError instanceof Error ? aircraftError.message : 'Failed to load aircraft.',
        variant: 'destructive',
      });
    }
  }, [aircraftError, toast]);

  const {
    data: serviceRequests = [],
    refetch: refetchServiceRequests,
    error: serviceRequestsError,
    isLoading: isLoadingServiceRequests,
  } = useQuery({
    queryKey: ['service-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          service_type,
          requested_departure,
          requested_date,
          requested_time,
          description,
          notes,
          status,
          priority,
          airport,
          created_at,
          aircraft_id,
          user_id,
          aircraft:aircraft_id(tail_number),
          owner:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  const handleStatusChange = async (requestId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      toast({ title: 'Status updated', description: `Service request status changed to ${status}` });
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleCardSelect = (requestId: string) => {
    const request = serviceRequests.find((sr: any) => sr.id === requestId);
    if (request) {
      setSelectedServiceRequest(request);
      setIsEditDialogOpen(true);
    }
  };

  // --- 2. ACTIONS ---

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!invoiceForm.clientId || !invoiceForm.rate || !invoiceForm.hours) {
        throw new Error('Missing fields');
      }
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const { data: invoiceId, error: rpcError } = await supabase.rpc('create_instruction_invoice', {
        p_owner_id: invoiceForm.clientId,
        p_aircraft_id: invoiceForm.aircraftId || null,
        p_description: `${invoiceForm.description} - ${invoiceForm.date}`,
        p_hours: parseFloat(invoiceForm.hours),
        p_rate_cents: Math.round(parseFloat(invoiceForm.rate) * 100),
        p_cfi_id: user.id,
      });

      if (rpcError) throw rpcError;
      if (!invoiceId) throw new Error('Failed to create invoice');

      const dueDate = format(subDays(new Date(), -14), 'yyyy-MM-dd');
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'sent', due_date: dueDate })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      const idToSend = typeof invoiceId === 'string' ? invoiceId : (invoiceId as { id?: string })?.id ?? String(invoiceId);
      const sendResult = await apiJson<{ message?: string; sent?: boolean }>('/api/invoices/send-email', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: idToSend }),
      });
      if (sendResult.sent === false) {
        throw new Error('Invoice saved but email was not sent. Set EMAIL_SERVICE=resend and RESEND_API_KEY to send emails.');
      }
      console.log("[Invoice] Send (initial): success");
    },
    onSuccess: () => {
      console.log("[Invoice] Created and sent: working");
      toast({ title: 'Invoice Sent', description: 'Client has been billed successfully.' });
      queryClient.invalidateQueries({ queryKey: ['cockpit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cockpit-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['cfi-invoices'] });
    },
    onError: (err: Error) => {
      console.error("[Invoice] Create/send failed:", err.message);
      toast({ variant: 'destructive', title: 'Failed', description: err.message });
    },
  });

  // --- Invoice Edit/Resend Helpers ---

  const openInvoiceEditor = (invoice: any) => {
    if (invoice.status === 'paid') return;

    setEditingInvoice(invoice);
    setEditNotes(invoice.notes || '');

    const lines = invoice.invoice_lines || [];
    const mapped = lines.map((line: any, idx: number) => ({
      id: `${idx}`,
      description: line.description || '',
      quantity: String(line.quantity ?? 1),
      rate: String(((line.unit_cents ?? 0) as number) / 100),
    }));
    setEditLineItems(mapped.length > 0 ? mapped : [{ id: '1', description: '', quantity: '1', rate: '0' }]);

    if (invoice.category === 'instruction') {
      const firstLine = lines[0];
      if (firstLine) {
        const parts = String(firstLine.description || '').split(' - ');
        const maybeDate = parts.pop();
        const descPart = parts.join(' - ');
        const validDate = maybeDate && !Number.isNaN(Date.parse(maybeDate))
          ? new Date(maybeDate).toISOString().split('T')[0]
          : '';
        setEditDescription(validDate ? descPart : (firstLine.description || ''));
        setEditFlightDate(validDate);
        setEditHours(String(firstLine.quantity ?? 1));
        setEditRate(String(((firstLine.unit_cents ?? 0) as number) / 100));
      } else {
        setEditDescription('');
        setEditFlightDate('');
        setEditHours('1');
        setEditRate('100');
      }
    }

    setIsInvoiceEditOpen(true);
  };

  const handleSaveInvoiceEdit = () => {
    if (!editingInvoice) return;

    const payloadLineItems = editingInvoice.category === 'instruction'
      ? [{
          description: editFlightDate ? `${editDescription} - ${editFlightDate}` : editDescription,
          quantity: parseFloat(editHours || '0'),
          unit_cents: Math.round(parseFloat(editRate || '0') * 100),
        }]
      : editLineItems.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity || '0'),
          unit_cents: Math.round(parseFloat(item.rate || '0') * 100),
        }));

    updateInvoiceMutation.mutate({
      invoiceId: editingInvoice.id,
      notes: editingInvoice.category === 'maintenance' ? editNotes : undefined,
      lineItems: payloadLineItems,
    }, {
      onSuccess: () => {
        setIsInvoiceEditOpen(false);
        setEditingInvoice(null);
        queryClient.invalidateQueries({ queryKey: ['cockpit-ledger'] });
        queryClient.invalidateQueries({ queryKey: ['cockpit-stats'] });
      },
    });
  };

  // --- 3. RENDER ---

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur z-50 sticky top-0">
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image
                src="/images/falogo.png"
                alt="FA"
                width={24}
                height={24}
                className="h-6 w-auto"
                style={{ width: 'auto' }}
              />
            </Link>
            <span className="text-sm font-semibold text-muted-foreground">/</span>
            <span className="font-semibold text-sm">Operations Cockpit</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 py-4 space-y-4">

        <Tabs value={activeToolTab} onValueChange={(value) => setActiveToolTab(value as CockpitToolTab)} className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Management Tools</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6 h-auto">
                <TabsTrigger value="invoice" className="justify-start gap-2"><DollarSign className="h-4 w-4" />Invoicing</TabsTrigger>
                <TabsTrigger value="requests" className="justify-start gap-2"><Wrench className="h-4 w-4" />Service Requests</TabsTrigger>
                <TabsTrigger value="aircraft" className="justify-start gap-2"><Plane className="h-4 w-4" />Aircraft</TabsTrigger>
                <TabsTrigger value="maintenance" className="justify-start gap-2"><Settings2 className="h-4 w-4" />Maintenance</TabsTrigger>
                <TabsTrigger value="clients" className="justify-start gap-2"><Users className="h-4 w-4" />Clients</TabsTrigger>
                <TabsTrigger value="staff" className="justify-start gap-2"><Users className="h-4 w-4" />Staff</TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="invoice" className="mt-0 space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-180px)] min-h-[600px]">
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
                      onValueChange={(val) => setInvoiceForm({ ...invoiceForm, clientId: val })}
                    >
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select Student" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formOptions?.clients ?? []).map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Aircraft</Label>
                    <Select
                      value={invoiceForm.aircraftId}
                      onValueChange={(val) => setInvoiceForm({ ...invoiceForm, aircraftId: val })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Aircraft (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formOptions?.aircraft ?? []).map((a: any) => (
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
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, hours: e.target.value })}
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
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, rate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Description</Label>
                    <Input
                      value={invoiceForm.description}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Flight Date</Label>
                    <Input
                      type="date"
                      className="h-10"
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 mt-auto">
                    <Button
                      className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                      onClick={() => createInvoice.mutate()}
                      disabled={createInvoice.isPending || !invoiceForm.clientId}
                    >
                      {createInvoice.isPending ? 'Sending...' : 'Send Invoice & Charge'}
                      {!createInvoice.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      Invoices are automatically emailed to the client.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">Time range</span>
                  <Tabs value={kpiPeriod} onValueChange={(v) => setKpiPeriod(v as KpiPeriod)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="7" className="text-xs px-2">7d</TabsTrigger>
                      <TabsTrigger value="30" className="text-xs px-2">30d</TabsTrigger>
                      <TabsTrigger value="90" className="text-xs px-2">90d</TabsTrigger>
                      <TabsTrigger value="all" className="text-xs px-2">All time</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {kpiPeriod === 'all' ? 'All time Revenue' : `${kpiPeriod}d Revenue`}
                        </p>
                        <div className="text-2xl font-bold text-emerald-600">
                          ${stats?.monthlyRevenue?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="h-20 flex flex-col justify-center border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collection Rate</p>
                        <div className="text-2xl font-bold text-blue-600">
                          {stats?.collectionRate?.toFixed(1) || '0'}%
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

                <Card className="flex-1 overflow-hidden flex flex-col">
                  <CardHeader className="py-4 px-6 border-b bg-muted/10">
                    <CardTitle className="text-base">Recent Ledger (Last 20)</CardTitle>
                  </CardHeader>
                  <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-muted/5 text-sm">
                    <span className="text-muted-foreground">
                      {selectedInvoiceIds.size} selected
                      {selectedInvoiceIds.size > 0 ? ` · $${selectedInvoicesTotal.toFixed(2)}` : ''}
                    </span>
                    <div className="flex-1 min-w-[8px]" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearInvoiceSelection}
                      disabled={selectedInvoiceIds.size === 0}
                    >
                      Clear
                    </Button>
                    {combineBlockReason !== null || combineInvoicesMutation.isPending ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1"
                              disabled={combineDisabled}
                              onClick={() => {
                                combineInvoicesMutation.mutate(Array.from(selectedInvoiceIds), {
                                  onSuccess: () => clearInvoiceSelection(),
                                });
                              }}
                            >
                              <Layers className="h-3.5 w-3.5" />
                              {combineInvoicesMutation.isPending ? 'Sending…' : 'Combine & Send'}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {combineInvoicesMutation.isPending ? 'Creating combined payment…' : combineBlockReason}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1"
                        disabled={combineDisabled}
                        onClick={() => {
                          combineInvoicesMutation.mutate(Array.from(selectedInvoiceIds), {
                            onSuccess: () => clearInvoiceSelection(),
                          });
                        }}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Combine & Send
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0 z-10">
                        <tr className="border-b">
                          <th className="h-10 w-10 pl-4 pr-1 text-left align-middle">
                            <Checkbox
                              checked={allBulkSelected ? true : someBulkSelected ? 'indeterminate' : false}
                              disabled={rowsForBulkSelect.length === 0}
                              onCheckedChange={(checked) => {
                                if (checked === true) {
                                  setSelectedInvoiceIds(new Set(rowsForBulkSelect.map((i: { id: string }) => i.id)));
                                } else {
                                  setSelectedInvoiceIds((prev) => {
                                    const next = new Set(prev);
                                    rowsForBulkSelect.forEach((i: { id: string }) => next.delete(i.id));
                                    return next;
                                  });
                                }
                              }}
                              aria-label="Select all invoices for bulk combine"
                            />
                          </th>
                          <th className="h-10 px-6 text-left font-medium text-muted-foreground w-[120px]">Date</th>
                          <th className="h-10 px-6 text-left font-medium text-muted-foreground">Client</th>
                          <th className="h-10 px-6 text-left font-medium text-muted-foreground">Description</th>
                          <th className="h-10 px-6 text-right font-medium text-muted-foreground">Amount</th>
                          <th className="h-10 px-6 text-right font-medium text-muted-foreground">Status</th>
                          <th className="h-10 px-4 text-right font-medium text-muted-foreground w-[180px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger?.map((inv: any) => {
                          const displayDesc = inv.invoice_lines?.[0]?.description || inv.category || '—';
                          const isPaid = inv.status === 'paid';
                          const canUnsend = !isPaid && (inv.status === 'sent' || inv.status === 'finalized' || inv.status === 'overdue');
                          const canDelete = !isPaid && inv.status === 'draft';
                          const rowSelectable = canSelectLedgerRow(inv, selectedOwnerId);
                          return (
                            <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                              <td className="p-2 pl-4 align-middle">
                                <Checkbox
                                  checked={selectedInvoiceIds.has(inv.id)}
                                  disabled={!rowSelectable}
                                  onCheckedChange={(checked) => {
                                    if (!rowSelectable) return;
                                    setSelectedInvoiceIds((prev) => {
                                      const next = new Set(prev);
                                      if (checked === true) next.add(inv.id);
                                      else next.delete(inv.id);
                                      return next;
                                    });
                                  }}
                                  aria-label={`Select invoice ${inv.invoice_number ?? inv.id}`}
                                />
                              </td>
                              <td className="p-4 px-6 font-mono text-xs text-muted-foreground">
                                {format(new Date(inv.created_at), 'MMM dd')}
                              </td>
                              <td className="p-4 px-6 font-medium">
                                {inv.owner?.full_name || inv.owner?.email || 'Unknown'}
                              </td>
                              <td className="p-4 px-6 text-muted-foreground">
                                {displayDesc}
                              </td>
                              <td className="p-4 px-6 text-right font-mono">
                                ${inv.amount?.toFixed(2)}
                              </td>
                              <td className="p-4 px-6 text-right">
                                <div className="flex flex-wrap items-center justify-end gap-1">
                                  <Badge
                                    variant="outline"
                                    className={`
                                    ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                    ${inv.status === 'sent' || inv.status === 'finalized' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                    ${inv.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                    ${inv.status === 'draft' ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                                  `}
                                  >
                                    {inv.status}
                                  </Badge>
                                  {inv.batch_id ? (
                                    <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wide">
                                      Batched
                                    </Badge>
                                  ) : null}
                                </div>
                              </td>
                              <td className="p-4 px-4 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => openInvoiceEditor(inv)}
                                    disabled={isPaid}
                                    title={isPaid ? 'Paid invoices cannot be edited' : 'Edit invoice'}
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => resendInvoiceMutation.mutate(inv.id)}
                                    disabled={isPaid || resendInvoiceMutation.isPending}
                                    title={isPaid ? 'Paid invoices cannot be resent' : 'Send invoice again'}
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Resend
                                  </Button>
                                  {canUnsend && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        if (window.confirm('Set this invoice back to draft? The client will no longer see it as sent.')) {
                                          unsendInvoiceMutation.mutate(inv.id);
                                        }
                                      }}
                                      disabled={unsendInvoiceMutation.isPending}
                                      title="Set invoice back to draft"
                                    >
                                      Unsend
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (window.confirm('Permanently delete this invoice? This cannot be undone.')) {
                                          deleteInvoiceMutation.mutate(inv.id);
                                        }
                                      }}
                                      disabled={deleteInvoiceMutation.isPending}
                                      title="Delete invoice"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!ledger?.length && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingServiceRequests ? (
                  <p className="text-muted-foreground py-8 text-center">Loading service requests...</p>
                ) : serviceRequestsError ? (
                  <div className="py-8 text-center">
                    <p className="text-destructive font-medium">Error loading service requests</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchServiceRequests()}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    <KanbanBoard
                      items={serviceRequests
                        .filter((sr: any) => sr && sr.id)
                        .map((sr: any) => ({
                          id: sr.id,
                          tailNumber: sr.aircraft?.tail_number || 'N/A',
                          type: sr.service_type,
                          requestedFor: sr.requested_departure ? format(new Date(sr.requested_departure), 'MMM d, yyyy HH:mm') : (sr.airport || 'TBD'),
                          notes: sr.description || '',
                          status: sr.status === 'pending' ? 'new' : sr.status === 'in_progress' ? 'in_progress' : 'done',
                          ownerName: sr.owner?.full_name || sr.owner?.email || undefined,
                        }))}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aircraft" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Aircraft</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAircraft ? (
                  <p className="text-muted-foreground py-8 text-center">Loading aircraft...</p>
                ) : (
                  <AircraftTable items={aircraftFull} owners={owners} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-0">
            <MaintenanceCRUD />
          </TabsContent>

          <TabsContent value="clients" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="mt-0">
            <StaffManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Invoice Dialog */}
      <Dialog open={isInvoiceEditOpen} onOpenChange={setIsInvoiceEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice {editingInvoice?.invoice_number ? `#${editingInvoice.invoice_number}` : ''}</DialogTitle>
            <DialogDescription>
              Update invoice details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <div className="space-y-4 py-2">
              {editingInvoice.category === 'instruction' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Flight Instruction" />
                  </div>
                  <div className="space-y-2">
                    <Label>Flight Date</Label>
                    <Input type="date" value={editFlightDate} onChange={(e) => setEditFlightDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Input type="number" step="0.1" min="0" value={editHours} onChange={(e) => setEditHours(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate ($)</Label>
                    <Input type="number" step="0.01" min="0" value={editRate} onChange={(e) => setEditRate(e.target.value)} />
                  </div>
                  <div className="col-span-full pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">${(parseFloat(editHours || '0') * parseFloat(editRate || '0')).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Optional maintenance notes" rows={3} />
                  </div>
                  <div className="space-y-3">
                    <Label>Line Items</Label>
                    {editLineItems.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                          <Input placeholder="Description" value={item.description} onChange={(e) => setEditLineItems((prev) => prev.map((li) => li.id === item.id ? { ...li, description: e.target.value } : li))} />
                        </div>
                        <div className="col-span-2">
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                          <Input type="number" step="0.1" min="0" placeholder="Qty" value={item.quantity} onChange={(e) => setEditLineItems((prev) => prev.map((li) => li.id === item.id ? { ...li, quantity: e.target.value } : li))} />
                        </div>
                        <div className="col-span-2">
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Rate ($)</Label>}
                          <Input type="number" step="0.01" min="0" placeholder="Rate" value={item.rate} onChange={(e) => setEditLineItems((prev) => prev.map((li) => li.id === item.id ? { ...li, rate: e.target.value } : li))} />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-sm font-medium w-16 text-right">${(parseFloat(item.quantity || '0') * parseFloat(item.rate || '0')).toFixed(2)}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={editLineItems.length <= 1} onClick={() => setEditLineItems((prev) => prev.filter((li) => li.id !== item.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditLineItems((prev) => [...prev, { id: `${Date.now()}`, description: '', quantity: '1', rate: '0' }])}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line Item
                    </Button>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">${editLineItems.reduce((sum, li) => sum + parseFloat(li.quantity || '0') * parseFloat(li.rate || '0'), 0).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveInvoiceEdit} disabled={updateInvoiceMutation.isPending}>
              {updateInvoiceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
