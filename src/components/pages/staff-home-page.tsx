'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  Wrench, 
  Users, 
  DollarSign, 
  BarChart3,
  AlertCircle,
  Activity,
  ArrowRight,
  Settings2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { NotificationCenter } from '@/components/notification-center';
import Image from 'next/image';

export function StaffHomePage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const managePath = pathname?.startsWith('/admin') ? '/admin/manage' : '/staff/manage';

  const { data: stats } = useQuery({
    queryKey: ['staff-dashboard-stats'],
    queryFn: async () => {
      const [
        aircraftResult,
        ownersResult, 
        serviceRequestsResult,
        maintenanceResult,
        invoicesResult
      ] = await Promise.all([
        supabase.from('aircraft').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner'),
        supabase.from('service_requests').select('id, status'),
        supabase.from('maintenance').select('id, status, due_date'),
        supabase.from('invoices').select('id, status, created_at').gte('created_at', subDays(new Date(), 30).toISOString())
      ]);

      const serviceRequests = serviceRequestsResult.data || [];
      const pendingRequests = serviceRequests.filter((sr: any) => sr.status === 'pending').length;
      const inProgressRequests = serviceRequests.filter((sr: any) => sr.status === 'in_progress').length;

      const maintenanceItems = maintenanceResult.data || [];
      const overdueMaintenanceCount = maintenanceItems.filter((m: any) => m.status === 'overdue').length;
      const dueSoonMaintenanceCount = maintenanceItems.filter((m: any) => m.status === 'due_soon').length;

      const invoices = invoicesResult.data || [];
      const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'finalized' || inv.status === 'sent').length;

      return {
        totalAircraft: aircraftResult.count || 0,
        totalOwners: ownersResult.count || 0,
        pendingServiceRequests: pendingRequests,
        inProgressServiceRequests: inProgressRequests,
        totalServiceRequests: serviceRequests.length,
        overdueMaintenanceCount,
        dueSoonMaintenanceCount,
        totalMaintenanceItems: maintenanceItems.length,
        unpaidInvoicesCount: unpaidInvoices,
        recentInvoicesCount: invoices.length
      };
    },
    refetchInterval: 60000
  });

  const { data: recentActivity = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['staff-recent-activity'],
    queryFn: async () => {
      const { data: serviceRequests } = await supabase
        .from('service_requests')
        .select(`
          id,
          service_type,
          status,
          created_at,
          aircraft:aircraft_id(tail_number),
          owner:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      return (serviceRequests || []).map((sr: any) => ({
        id: sr.id,
        type: 'service_request',
        title: sr.service_type,
        description: `${sr.aircraft?.tail_number || 'N/A'} - ${sr.owner?.full_name || sr.owner?.email || 'Unknown'}`,
        status: sr.status,
        timestamp: sr.created_at,
        icon: Wrench,
        color: sr.status === 'pending' ? 'text-yellow-600' : sr.status === 'in_progress' ? 'text-blue-600' : 'text-green-600'
      }));
    },
    refetchInterval: 30000
  });

  const { data: attentionItems = [] } = useQuery({
    queryKey: ['staff-attention-items'],
    queryFn: async () => {
      const items: any[] = [];

      const { data: pendingRequests } = await supabase
        .from('service_requests')
        .select(`
          id,
          service_type,
          requested_date,
          aircraft:aircraft_id(tail_number)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(3);

      (pendingRequests || []).forEach((req: any) => {
        items.push({
          id: req.id,
          type: 'service_request',
          title: `Pending ${req.service_type}`,
          description: `${req.aircraft?.tail_number || 'N/A'} - ${req.requested_date ? format(new Date(req.requested_date), 'MMM d') : 'ASAP'}`,
          priority: 'high',
          actionLabel: 'Review',
          actionPath: `${managePath}?tab=requests`
        });
      });

      const { data: overdueItems } = await supabase
        .from('maintenance')
        .select(`
          id,
          item_name,
          due_date,
          aircraft:aircraft_id(tail_number)
        `)
        .eq('status', 'overdue')
        .order('due_date', { ascending: true })
        .limit(3);

      (overdueItems || []).forEach((item: any) => {
        items.push({
          id: item.id,
          type: 'maintenance',
          title: `Overdue: ${item.item_name}`,
          description: `${item.aircraft?.tail_number || 'N/A'} - Due ${format(new Date(item.due_date), 'MMM d')}`,
          priority: 'critical',
          actionLabel: 'View',
          actionPath: `${managePath}?tab=maintenance`
        });
      });

      return items;
    },
    refetchInterval: 60000
  });

  const quickAccessCards = [
    {
      title: 'Service Requests',
      description: 'Manage pending service requests',
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: `${managePath}?tab=requests`,
      stats: {
        pending: stats?.pendingServiceRequests || 0,
        inProgress: stats?.inProgressServiceRequests || 0
      }
    },
    {
      title: 'Aircraft Fleet',
      description: 'View and manage aircraft',
      icon: Plane,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: `${managePath}?tab=aircraft`,
      stats: {
        total: stats?.totalAircraft || 0
      }
    },
    {
      title: 'Maintenance',
      description: 'Track maintenance schedules',
      icon: Settings2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: `${managePath}?tab=maintenance`,
      stats: {
        overdue: stats?.overdueMaintenanceCount || 0,
        dueSoon: stats?.dueSoonMaintenanceCount || 0
      }
    },
    {
      title: 'Clients',
      description: 'Manage client accounts',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: `${managePath}?tab=clients`,
      stats: {
        total: stats?.totalOwners || 0
      }
    },
    {
      title: 'Invoices',
      description: 'Create and track invoices',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: `${managePath}?tab=invoices`,
      stats: {
        unpaid: stats?.unpaidInvoicesCount || 0
      }
    },
    {
      title: 'Reports',
      description: 'View analytics and reports',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      path: `${managePath}?tab=reports`,
      stats: {}
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image
                  src="/images/falogo.png"
                  alt="Freedom Aviation"
                  width={32}
                  height={32}
                  className="h-8 w-auto transition-opacity hover:opacity-80"
                  style={{ width: 'auto' }}
                />
              </Link>
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Staff Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(managePath)}
              >
                Management Console
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Home
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your aviation operations
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAircraft || 0}</div>
                <p className="text-xs text-muted-foreground">Active in fleet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingServiceRequests || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{stats?.inProgressServiceRequests || 0} in progress</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Items</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overdueMaintenanceCount || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-orange-600">{stats?.dueSoonMaintenanceCount || 0} due soon</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.unpaidInvoicesCount || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </CardContent>
            </Card>
          </div>

          {attentionItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Attention Required</h3>
                <Badge variant="secondary">{attentionItems.length} items</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {attentionItems.map((item: any) => (
                  <Card key={item.id} className="relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityColor(item.priority).split(' ')[0]}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <Badge className={getPriorityColor(item.priority)} variant="secondary">
                          {item.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(item.actionPath)}
                        className="w-full"
                      >
                        {item.actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Quick Access</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quickAccessCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card 
                    key={card.title} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(card.path)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                          <Icon className={`h-6 w-6 ${card.color}`} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm">
                        {card.stats.total !== undefined && (
                          <div>
                            <p className="text-2xl font-bold">{card.stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        )}
                        {card.stats.pending !== undefined && (
                          <div>
                            <p className="text-2xl font-bold text-yellow-600">{card.stats.pending}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                        )}
                        {card.stats.inProgress !== undefined && (
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{card.stats.inProgress}</p>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                          </div>
                        )}
                        {card.stats.overdue !== undefined && card.stats.overdue > 0 && (
                          <div>
                            <p className="text-2xl font-bold text-red-600">{card.stats.overdue}</p>
                            <p className="text-xs text-muted-foreground">Overdue</p>
                          </div>
                        )}
                        {card.stats.dueSoon !== undefined && card.stats.dueSoon > 0 && (
                          <div>
                            <p className="text-2xl font-bold text-orange-600">{card.stats.dueSoon}</p>
                            <p className="text-xs text-muted-foreground">Due Soon</p>
                          </div>
                        )}
                        {card.stats.unpaid !== undefined && (
                          <div>
                            <p className="text-2xl font-bold text-orange-600">{card.stats.unpaid}</p>
                            <p className="text-xs text-muted-foreground">Unpaid</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Recent Activity</h3>
              <Button variant="outline" size="sm" onClick={() => router.push(`${managePath}?tab=requests`)}>
                View All
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {isLoadingActivity ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading recent activity...
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No recent activity
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentActivity.map((activity: any) => {
                      const Icon = activity.icon;
                      return (
                        <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${activity.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-xs">
                                  {activity.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

