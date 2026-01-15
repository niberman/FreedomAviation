import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FlightLineHero } from "./components/FlightLineHero";
import { ActionGrid } from "./components/ActionGrid";
import { OpsFeed } from "./components/OpsFeed";
import { StagingDrawer } from "./components/Drawers/StagingDrawer";
import { SquawkDrawer } from "./components/Drawers/SquawkDrawer";
import { InstructionDrawer } from "./components/Drawers/InstructionDrawer";
import { useOpsFeed } from "./hooks/useOpsFeed";
import { useAircraftStatus } from "./hooks/useAircraftStatus";
import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, History } from "lucide-react";
import { Link } from "wouter";
import { Aircraft } from "@/shared/database-types";

export function OwnerDashboardFeature() {
  const { user } = useAuth();
  const [activeDrawer, setActiveDrawer] = useState<'staging' | 'squawk' | 'instruction' | null>(null);

  // 1. Fetch Aircraft
  const { data: aircraftList, isLoading: aircraftLoading } = useQuery({
    queryKey: ["owner-aircraft", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .eq("owner_id", user?.id);
      if (error) throw error;
      return data as Aircraft[];
    }
  });

  const aircraft = aircraftList?.[0];

  // 2. Fetch Ops Feed & Status
  const { data: feedItems = [], isLoading: feedLoading } = useOpsFeed(user?.id, aircraft?.id);
  const { data: operationalStatus = 'READY TO FLY' } = useAircraftStatus(aircraft?.id);

  if (aircraftLoading) {
    return (
      <DashboardLayout title="Loading..." navItems={ownerDashboardNavItems}>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!aircraft) {
    return (
      <DashboardLayout title="No Aircraft Found" navItems={ownerDashboardNavItems}>
        <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
          <h2 className="text-xl font-bold text-slate-200 mb-2">No Aircraft Assigned</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            It looks like there aren't any aircraft associated with your account yet. Please contact support if you believe this is an error.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Concierge Command"
      navItems={ownerDashboardNavItems}
      showHeader={false}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800">
              <Home className="h-4 w-4" />
              Portal
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Nav */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 backdrop-blur-sm">
            <Button variant="secondary" size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
              <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
              Command Center
            </Button>
            <Link href="/dashboard/more">
              <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-slate-100">
                <History className="h-3.5 w-3.5 mr-2" />
                Ops History
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <FlightLineHero 
          aircraft={aircraft} 
          status={operationalStatus} 
          fuelLevel={85} // Mock or fetch from aircraft_fuel_status
        />

        {/* Action Grid */}
        <section className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.2em] font-black text-slate-500 ml-1">Quick Controls</h3>
          <ActionGrid 
            onStagingClick={() => setActiveDrawer('staging')}
            onSquawkClick={() => setActiveDrawer('squawk')}
            onInstructionClick={() => setActiveDrawer('instruction')}
          />
        </section>

        {/* Ops Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-xs uppercase tracking-[0.2em] font-black text-slate-500">Live Operations Feed</h3>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-indigo-500 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Live Sync Active
            </span>
          </div>
          <OpsFeed items={feedItems} isLoading={feedLoading} />
        </section>
      </div>

      {/* Action Drawers */}
      <StagingDrawer 
        isOpen={activeDrawer === 'staging'} 
        onClose={() => setActiveDrawer(null)} 
        aircraftId={aircraft.id}
        userId={user?.id || ''}
      />
      <SquawkDrawer 
        isOpen={activeDrawer === 'squawk'} 
        onClose={() => setActiveDrawer(null)} 
        aircraftId={aircraft.id}
        userId={user?.id || ''}
      />
      <InstructionDrawer 
        isOpen={activeDrawer === 'instruction'} 
        onClose={() => setActiveDrawer(null)} 
        aircraftId={aircraft.id}
        userId={user?.id || ''}
      />
    </DashboardLayout>
  );
}
