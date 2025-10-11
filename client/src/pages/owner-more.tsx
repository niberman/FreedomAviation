import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Wrench, Droplet, Award, CreditCard, MessageSquare, Plane } from "lucide-react";

const sections = [
  { icon: Calendar, title: "Upcoming Reservations", description: "View and manage your flight schedule" },
  { icon: Wrench, title: "Maintenance Due", description: "Track upcoming maintenance items" },
  { icon: Droplet, title: "Consumables", description: "Oil, O₂, and TKS fluid levels" },
  { icon: Award, title: "Pilot Currency", description: "IPC, BFR, and medical status" },
  { icon: CreditCard, title: "Payment Methods", description: "Manage billing and invoices" },
  { icon: MessageSquare, title: "Support Tickets", description: "Contact support and track requests" },
];

export default function OwnerMore() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Freedom Aviation</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">More Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, idx) => (
              <Card key={idx} className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <section.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                  <p className="text-xs text-muted-foreground mt-4 italic">No items to display</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
