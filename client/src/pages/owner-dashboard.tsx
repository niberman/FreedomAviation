import { YourAircraftCard } from "@/components/your-aircraft-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MoreHorizontal, Plane } from "lucide-react";

export default function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Freedom Aviation</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/more">
              <Button variant="ghost" data-testid="button-more">
                <MoreHorizontal className="h-5 w-5 mr-2" />
                More
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <YourAircraftCard />
        </div>
      </main>
    </div>
  );
}
