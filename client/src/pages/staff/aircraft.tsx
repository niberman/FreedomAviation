import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { AircraftTable } from "@/components/aircraft-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function StaffAircraft() {
  const { user } = useAuth();
  
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
    enabled: Boolean(user),
    retry: false,
  });
  
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
    enabled: Boolean(user),
  });

  return (
    <DashboardLayout
      title="Aircraft"
      description="View and manage all aircraft in the fleet"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Fleet Management</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Track aircraft details, ownership, and maintenance status
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
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
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
    </DashboardLayout>
  );
}