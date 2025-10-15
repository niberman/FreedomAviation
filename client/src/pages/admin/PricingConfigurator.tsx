import { useState, useEffect } from "react";
import {
  useAssumptions,
  useSaveAssumptions,
  useLocations,
  useSaveLocation,
  useClasses,
  useOverrides,
  usePublishSnapshot,
  type Location,
  type PricingClass,
} from "../../features/pricing/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Rocket } from "lucide-react";

export default function PricingConfigurator() {
  const { toast } = useToast();
  const assumptionsQuery = useAssumptions();
  const locationsQuery = useLocations();
  const classesQuery = useClasses();
  const overridesQuery = useOverrides();
  
  const saveAssumptions = useSaveAssumptions();
  const saveLocation = useSaveLocation();
  const publishSnapshot = usePublishSnapshot();

  const [assumptions, setAssumptions] = useState(assumptionsQuery.data || {
    labor_rate: 30,
    card_fee_pct: 3,
    cfi_allocation: 42,
    cleaning_supplies: 50,
    overhead_per_ac: 106,
    avionics_db_per_ac: 0,
  });

  // Hydrate state when query data loads
  useEffect(() => {
    if (assumptionsQuery.data) {
      setAssumptions(assumptionsQuery.data);
    }
  }, [assumptionsQuery.data]);

  const handleSaveAssumptions = async () => {
    try {
      await saveAssumptions.mutateAsync(assumptions);
      toast({ title: "Saved", description: "Assumptions updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save assumptions", variant: "destructive" });
    }
  };

  const handlePublish = async () => {
    try {
      const payload = {
        assumptions: assumptionsQuery.data,
        locations: locationsQuery.data,
        classes: classesQuery.data,
        overrides: overridesQuery.data,
      };

      await publishSnapshot.mutateAsync({
        label: `Snapshot ${new Date().toISOString()}`,
        payload,
      });

      toast({ title: "Published!", description: "Pricing snapshot created successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to publish snapshot", variant: "destructive" });
    }
  };

  if (assumptionsQuery.isLoading || locationsQuery.isLoading || classesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Handle error states
  if (assumptionsQuery.isError || locationsQuery.isError || classesQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Configuration Unavailable</h2>
          <p className="text-muted-foreground mb-6">
            The pricing configuration tables are not accessible. Please ensure the database schema is properly set up.
          </p>
          <p className="text-sm text-muted-foreground">
            Go to your Supabase Dashboard → Settings → API → Click "Reload Schema"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Configurator</h1>
          <p className="text-muted-foreground">Manage hangar partnerships and pricing models</p>
        </div>
        <Button onClick={handlePublish} disabled={publishSnapshot.isPending} data-testid="button-publish-snapshot">
          {publishSnapshot.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          Publish Snapshot
        </Button>
      </div>

      {/* Assumptions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Global Assumptions</CardTitle>
          <CardDescription>Base cost parameters used across all calculations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="labor_rate">Labor Rate ($/hr)</Label>
              <Input
                id="labor_rate"
                type="number"
                value={assumptions.labor_rate}
                onChange={(e) => setAssumptions({ ...assumptions, labor_rate: Number(e.target.value) })}
                data-testid="input-labor-rate"
              />
            </div>
            <div>
              <Label htmlFor="card_fee_pct">Card Fee (%)</Label>
              <Input
                id="card_fee_pct"
                type="number"
                value={assumptions.card_fee_pct}
                onChange={(e) => setAssumptions({ ...assumptions, card_fee_pct: Number(e.target.value) })}
                data-testid="input-card-fee"
              />
            </div>
            <div>
              <Label htmlFor="cfi_allocation">CFI Allocation ($)</Label>
              <Input
                id="cfi_allocation"
                type="number"
                value={assumptions.cfi_allocation}
                onChange={(e) => setAssumptions({ ...assumptions, cfi_allocation: Number(e.target.value) })}
                data-testid="input-cfi-allocation"
              />
            </div>
            <div>
              <Label htmlFor="cleaning_supplies">Cleaning Supplies ($)</Label>
              <Input
                id="cleaning_supplies"
                type="number"
                value={assumptions.cleaning_supplies}
                onChange={(e) => setAssumptions({ ...assumptions, cleaning_supplies: Number(e.target.value) })}
                data-testid="input-cleaning-supplies"
              />
            </div>
            <div>
              <Label htmlFor="overhead_per_ac">Overhead per A/C ($)</Label>
              <Input
                id="overhead_per_ac"
                type="number"
                value={assumptions.overhead_per_ac}
                onChange={(e) => setAssumptions({ ...assumptions, overhead_per_ac: Number(e.target.value) })}
                data-testid="input-overhead"
              />
            </div>
            <div>
              <Label htmlFor="avionics_db_per_ac">Avionics DB per A/C ($)</Label>
              <Input
                id="avionics_db_per_ac"
                type="number"
                value={assumptions.avionics_db_per_ac}
                onChange={(e) => setAssumptions({ ...assumptions, avionics_db_per_ac: Number(e.target.value) })}
                data-testid="input-avionics-db"
              />
            </div>
          </div>
          <Button onClick={handleSaveAssumptions} disabled={saveAssumptions.isPending} data-testid="button-save-assumptions">
            {saveAssumptions.isPending ? "Saving..." : "Save Assumptions"}
          </Button>
        </CardContent>
      </Card>

      {/* Locations Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hangar Locations</CardTitle>
          <CardDescription>Sky Harbour & Freedom Aviation Hangar partnerships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locationsQuery.data?.map((loc: Location) => (
              <div key={loc.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`location-${loc.slug}`}>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{loc.name}</p>
                    <p className="text-sm text-muted-foreground">Hangar cost: ${loc.hangar_cost_monthly || 0}/mo</p>
                  </div>
                  {loc.slug === 'sky-harbour' && (
                    <Badge variant="default">Preferred Partner</Badge>
                  )}
                  {loc.slug === 'freedom-aviation-hangar' && (
                    <Badge variant="secondary">FA Home Base</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Classes Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Classes</CardTitle>
          <CardDescription>Class templates with default pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classesQuery.data?.map((cls: PricingClass) => (
              <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`class-${cls.id}`}>
                <div>
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${cls.base_monthly}/mo base price
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
