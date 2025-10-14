import { useState, useEffect } from "react";
import { useAircraft } from "../../lib/hooks/useAircraft";
import {
  useAssumptions,
  useSaveAssumptions,
  useLocations,
  useSaveLocation,
  useClasses,
  useSaveClass,
  usePublishSnapshot,
  type Location,
  type PricingClass,
} from "../../features/pricing/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Package, Building2, DollarSign, Settings, Rocket, Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function PackageConfigurator() {
  const { toast } = useToast();
  const { aircraft } = useAircraft();
  const assumptionsQuery = useAssumptions();
  const locationsQuery = useLocations();
  const classesQuery = useClasses();
  
  const saveAssumptions = useSaveAssumptions();
  const saveLocation = useSaveLocation();
  const saveClass = useSaveClass();
  const publishSnapshot = usePublishSnapshot();

  const [assumptions, setAssumptions] = useState(assumptionsQuery.data || {
    labor_rate: 30,
    card_fee_pct: 3,
    cfi_allocation: 42,
    cleaning_supplies: 50,
    overhead_per_ac: 106,
    avionics_db_per_ac: 0,
  });

  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingClass, setEditingClass] = useState<PricingClass | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);

  // Hydrate state when query data loads
  useEffect(() => {
    if (assumptionsQuery.data) {
      setAssumptions(assumptionsQuery.data);
    }
  }, [assumptionsQuery.data]);

  const handleSaveAssumptions = async () => {
    try {
      await saveAssumptions.mutateAsync(assumptions);
      toast({ title: "Saved", description: "Cost assumptions updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save assumptions", variant: "destructive" });
    }
  };

  const handleSaveLocation = async () => {
    if (!editingLocation) return;
    
    try {
      await saveLocation.mutateAsync(editingLocation);
      toast({ title: "Saved", description: "Hangar location updated successfully" });
      setIsLocationDialogOpen(false);
      setEditingLocation(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save location", variant: "destructive" });
    }
  };

  const handleSaveClass = async () => {
    if (!editingClass) return;
    
    try {
      await saveClass.mutateAsync(editingClass);
      toast({ title: "Saved", description: "Service class updated successfully" });
      setIsClassDialogOpen(false);
      setEditingClass(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save class", variant: "destructive" });
    }
  };

  const handlePublish = async () => {
    try {
      const payload = {
        assumptions: assumptionsQuery.data,
        locations: locationsQuery.data,
        classes: classesQuery.data,
      };

      await publishSnapshot.mutateAsync({
        label: `Package Pricing ${new Date().toLocaleDateString()}`,
        payload,
      });

      toast({ 
        title: "Published!", 
        description: "Pricing packages with hangar costs are now live" 
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to publish pricing packages", 
        variant: "destructive" 
      });
    }
  };

  const calculatePackagePrice = (baseMonthly: number, hangarCost: number) => {
    return baseMonthly + hangarCost;
  };

  if (assumptionsQuery.isLoading || locationsQuery.isLoading || classesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const locations = locationsQuery.data || [];
  const classes = classesQuery.data || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Package Pricing Configurator</h1>
          <p className="text-muted-foreground">Build service packages with integrated hangar costs</p>
        </div>
        <Button 
          onClick={handlePublish} 
          disabled={publishSnapshot.isPending} 
          data-testid="button-publish-packages"
        >
          {publishSnapshot.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          Publish Packages
        </Button>
      </div>

      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="packages" data-testid="tab-packages">
            <Package className="mr-2 h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="locations" data-testid="tab-locations">
            <Building2 className="mr-2 h-4 w-4" />
            Hangar Locations
          </TabsTrigger>
          <TabsTrigger value="classes" data-testid="tab-classes">
            <DollarSign className="mr-2 h-4 w-4" />
            Service Classes
          </TabsTrigger>
          <TabsTrigger value="assumptions" data-testid="tab-assumptions">
            <Settings className="mr-2 h-4 w-4" />
            Cost Assumptions
          </TabsTrigger>
        </TabsList>

        {/* PACKAGES TAB - Package Builder with Hangar Costs */}
        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Packages with Hangar Costs</CardTitle>
              <CardDescription>
                Each package combines base service pricing with location-specific hangar costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {classes.map((serviceClass) => (
                  <div key={serviceClass.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{serviceClass.name}</h3>
                        <p className="text-sm text-muted-foreground">{serviceClass.description}</p>
                        <p className="text-sm font-medium mt-1">
                          Base Service: ${serviceClass.base_monthly?.toFixed(2)}/month
                        </p>
                      </div>
                      <Badge variant="outline">
                        {locations.length} location{locations.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {locations.map((location) => {
                        const totalPrice = calculatePackagePrice(
                          serviceClass.base_monthly || 0,
                          location.hangar_cost_monthly || 0
                        );
                        
                        return (
                          <Card key={location.id} className="hover-elevate">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>{location.name}</span>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Base Service:</span>
                                  <span>${serviceClass.base_monthly?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Hangar Cost:</span>
                                  <span>${location.hangar_cost_monthly?.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-border my-2" />
                                <div className="flex justify-between font-semibold">
                                  <span>Total Package:</span>
                                  <span className="text-primary">${totalPrice.toFixed(2)}/mo</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {classes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No service classes configured. Add classes in the Service Classes tab.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HANGAR LOCATIONS TAB */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hangar Partnership Locations</CardTitle>
                  <CardDescription>Manage hangar facilities and monthly costs</CardDescription>
                </div>
                <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingLocation({
                        id: '',
                        name: '',
                        slug: '',
                        hangar_cost_monthly: 0,
                        description: '',
                        active: true,
                      } as Location)}
                      data-testid="button-add-location"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingLocation?.id ? 'Edit' : 'Add'} Hangar Location
                      </DialogTitle>
                      <DialogDescription>
                        Configure hangar facility details and monthly costs
                      </DialogDescription>
                    </DialogHeader>
                    {editingLocation && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="location-name">Location Name</Label>
                          <Input
                            id="location-name"
                            value={editingLocation.name}
                            onChange={(e) => setEditingLocation({
                              ...editingLocation,
                              name: e.target.value,
                              slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                            })}
                            data-testid="input-location-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hangar-cost">Monthly Hangar Cost</Label>
                          <Input
                            id="hangar-cost"
                            type="number"
                            value={editingLocation.hangar_cost_monthly}
                            onChange={(e) => setEditingLocation({
                              ...editingLocation,
                              hangar_cost_monthly: parseFloat(e.target.value) || 0,
                            })}
                            data-testid="input-hangar-cost"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location-desc">Description</Label>
                          <Textarea
                            id="location-desc"
                            value={editingLocation.description || ''}
                            onChange={(e) => setEditingLocation({
                              ...editingLocation,
                              description: e.target.value,
                            })}
                            data-testid="input-location-description"
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button 
                        onClick={handleSaveLocation} 
                        disabled={saveLocation.isPending}
                        data-testid="button-save-location"
                      >
                        {saveLocation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Save Location
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Monthly Hangar Cost</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          ${location.hangar_cost_monthly?.toFixed(2)}/mo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {location.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLocation(location);
                            setIsLocationDialogOpen(true);
                          }}
                          data-testid={`button-edit-location-${location.slug}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SERVICE CLASSES TAB */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Class Tiers</CardTitle>
                  <CardDescription>Configure base monthly pricing for service levels</CardDescription>
                </div>
                <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingClass({
                        id: '',
                        name: '',
                        slug: '',
                        base_monthly: 0,
                        description: '',
                        active: true,
                      } as PricingClass)}
                      data-testid="button-add-class"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingClass?.id ? 'Edit' : 'Add'} Service Class
                      </DialogTitle>
                      <DialogDescription>
                        Configure service tier and base monthly pricing
                      </DialogDescription>
                    </DialogHeader>
                    {editingClass && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="class-name">Class Name</Label>
                          <Input
                            id="class-name"
                            value={editingClass.name}
                            onChange={(e) => setEditingClass({
                              ...editingClass,
                              name: e.target.value,
                              slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                            })}
                            data-testid="input-class-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="base-monthly">Base Monthly Price</Label>
                          <Input
                            id="base-monthly"
                            type="number"
                            value={editingClass.base_monthly}
                            onChange={(e) => setEditingClass({
                              ...editingClass,
                              base_monthly: parseFloat(e.target.value) || 0,
                            })}
                            data-testid="input-base-monthly"
                          />
                        </div>
                        <div>
                          <Label htmlFor="class-desc">Description</Label>
                          <Textarea
                            id="class-desc"
                            value={editingClass.description || ''}
                            onChange={(e) => setEditingClass({
                              ...editingClass,
                              description: e.target.value,
                            })}
                            data-testid="input-class-description"
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button 
                        onClick={handleSaveClass} 
                        disabled={saveClass.isPending}
                        data-testid="button-save-class"
                      >
                        {saveClass.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Save Class
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Class</TableHead>
                    <TableHead>Base Monthly Price</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((serviceClass) => (
                    <TableRow key={serviceClass.id}>
                      <TableCell className="font-medium">{serviceClass.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          ${serviceClass.base_monthly?.toFixed(2)}/mo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {serviceClass.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingClass(serviceClass);
                            setIsClassDialogOpen(true);
                          }}
                          data-testid={`button-edit-class-${serviceClass.slug}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COST ASSUMPTIONS TAB */}
        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Cost Assumptions</CardTitle>
              <CardDescription>Base parameters for all pricing calculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="labor-rate">Labor Rate ($/hr)</Label>
                  <Input
                    id="labor-rate"
                    type="number"
                    value={assumptions.labor_rate}
                    onChange={(e) => setAssumptions({
                      ...assumptions,
                      labor_rate: parseFloat(e.target.value) || 0,
                    })}
                    data-testid="input-labor-rate"
                  />
                </div>
                <div>
                  <Label htmlFor="card-fee">Card Fee (%)</Label>
                  <Input
                    id="card-fee"
                    type="number"
                    value={assumptions.card_fee_pct}
                    onChange={(e) => setAssumptions({
                      ...assumptions,
                      card_fee_pct: parseFloat(e.target.value) || 0,
                    })}
                    data-testid="input-card-fee"
                  />
                </div>
                <div>
                  <Label htmlFor="cfi-allocation">CFI Allocation ($)</Label>
                  <Input
                    id="cfi-allocation"
                    type="number"
                    value={assumptions.cfi_allocation}
                    onChange={(e) => setAssumptions({
                      ...assumptions,
                      cfi_allocation: parseFloat(e.target.value) || 0,
                    })}
                    data-testid="input-cfi-allocation"
                  />
                </div>
                <div>
                  <Label htmlFor="cleaning">Cleaning Supplies ($)</Label>
                  <Input
                    id="cleaning"
                    type="number"
                    value={assumptions.cleaning_supplies}
                    onChange={(e) => setAssumptions({
                      ...assumptions,
                      cleaning_supplies: parseFloat(e.target.value) || 0,
                    })}
                    data-testid="input-cleaning"
                  />
                </div>
                <div>
                  <Label htmlFor="overhead">Overhead per A/C ($)</Label>
                  <Input
                    id="overhead"
                    type="number"
                    value={assumptions.overhead_per_ac}
                    onChange={(e) => setAssumptions({
                      ...assumptions,
                      overhead_per_ac: parseFloat(e.target.value) || 0,
                    })}
                    data-testid="input-overhead"
                  />
                </div>
                <div>
                  <Label htmlFor="avionics">Avionics DB per A/C ($)</Label>
                  <Input
                    id="avionics"
                    type="number"
                    value={assumptions.avionics_db_per_ac}
                    onChange={(e) => setAssumptions({
                      ...assumptions,
                      avionics_db_per_ac: parseFloat(e.target.value) || 0,
                    })}
                    data-testid="input-avionics"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveAssumptions} 
                disabled={saveAssumptions.isPending}
                data-testid="button-save-assumptions"
              >
                {saveAssumptions.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Assumptions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
