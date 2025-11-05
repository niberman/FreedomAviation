import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, CheckCircle2, Calendar } from "lucide-react";
import aircraftImage from "@assets/stock_images/modern_sleek_aircraf_8d8e0a84.jpg";
import { useState } from "react";
import { PrepareAircraftSheet } from "./prepare-aircraft-sheet";
import { RequestServiceSheet } from "./request-service-sheet";

interface YourAircraftCardProps {
  aircraft?: {
    tailNumber: string;
    make: string;
    model: string;
    baseAirport: string;
    hoursPerMonth: number;
    membershipClass: string;
    planCode: string;
  };
}

export function YourAircraftCard({ aircraft }: YourAircraftCardProps) {
  const [prepareSheetOpen, setPrepareSheetOpen] = useState(false);
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);

  // TODO: remove mock functionality
  const mockAircraftData = aircraft || {
    tailNumber: "N847SR",
    make: "Cirrus",
    model: "SR22T",
    baseAirport: "KAPA",
    hoursPerMonth: 22,
    membershipClass: "Class II",
    planCode: "class_ii_standard"
  };
  
  // For PrepareAircraftSheet which requires id
  const mockAircraft = {
    id: "mock-id",
    tailNumber: mockAircraftData.tailNumber,
    make: mockAircraftData.make,
    model: mockAircraftData.model,
  };

  const includedServices = [
    "2x Weekly Readiness",
    "2 Full Details/Month",
    "Fluid Top-Offs",
    "Avionics DB Updates",
    "Maintenance Coordination"
  ];

  return (
    <>
      <Card className="overflow-hidden">
        <div 
          className="h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${aircraftImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <Badge className="absolute top-4 right-4 font-mono text-base px-3 py-1">
            {mockAircraft.tailNumber}
          </Badge>
        </div>
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-1">Your Aircraft</CardTitle>
              <p className="text-lg text-muted-foreground">
                {mockAircraft.make} {mockAircraft.model}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {mockAircraftData.membershipClass}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Base Airport</p>
              <p className="font-mono font-semibold">{mockAircraftData.baseAirport}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Hours/Month</p>
              <p className="font-semibold">{mockAircraftData.hoursPerMonth}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-semibold mb-3">Included Services</p>
            <div className="grid grid-cols-1 gap-2">
              {includedServices.map((service, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-3">
            <Button 
              className="w-full justify-start" 
              size="lg"
              onClick={() => setPrepareSheetOpen(true)}
              data-testid="button-prepare-aircraft"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Prepare Aircraft for Flight
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              size="lg"
              onClick={() => setServiceSheetOpen(true)}
              data-testid="button-request-service"
            >
              <Plane className="h-5 w-5 mr-2" />
              Request Service
            </Button>
          </div>
        </CardContent>
      </Card>

      <PrepareAircraftSheet 
        open={prepareSheetOpen} 
        onOpenChange={setPrepareSheetOpen}
        aircraft={mockAircraft}
      />
      
      <RequestServiceSheet 
        open={serviceSheetOpen} 
        onOpenChange={setServiceSheetOpen}
        aircraft={{
          id: "mock-aircraft-id",
          tailNumber: mockAircraft.tailNumber,
          make: mockAircraft.make,
          model: mockAircraft.model,
        }}
      />
    </>
  );
}
