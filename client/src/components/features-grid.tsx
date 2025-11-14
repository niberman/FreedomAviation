import { Card, CardContent } from "@/components/ui/card";
import { Droplets, Database, ClipboardCheck, Wrench, Calendar, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Droplets,
    title: "Fluid Management",
    description: "Oil, O₂, and TKS top-offs handled automatically. Your aircraft is always ready."
  },
  {
    icon: Database,
    title: "Avionics Updates",
    description: "Database updates applied on schedule. Navigate with confidence and compliance."
  },
  {
    icon: ClipboardCheck,
    title: "Pre-Flight Ready",
    description: "Complete pre/post-flight checks and staging coordination included."
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    description: "Hobbs, tach, and calendar-based maintenance monitored and managed."
  },
  {
    icon: Calendar,
    title: "Concierge Service",
    description: "On-demand scheduling, detailing, and personalized aircraft care."
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Expert support whenever you need it. Call, text, or use the portal."
  }
];

export function FeaturesGrid() {
  return (
    <div className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4">Always Included Services</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Every membership includes comprehensive aircraft care so you can focus on flying.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="hover-elevate active-elevate-2">
              <CardContent className="p-5 sm:p-6">
                <feature.icon className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
