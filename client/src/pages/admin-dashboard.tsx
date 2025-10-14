import { ThemeToggle } from "@/components/theme-toggle";
import { KanbanBoard } from "@/components/kanban-board";
import { AircraftTable } from "@/components/aircraft-table";
import { MaintenanceList } from "@/components/maintenance-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoImage from "@assets/freedom-aviation-logo.png";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Freedom Aviation" className="h-8 w-auto" />
            <h1 className="text-xl font-semibold">Freedom Aviation - Admin</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-8">
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" data-testid="tab-requests">Service Requests</TabsTrigger>
            <TabsTrigger value="aircraft" data-testid="tab-aircraft">Aircraft</TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <h2 className="text-2xl font-semibold">Service Requests</h2>
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="aircraft" className="space-y-4">
            <AircraftTable />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceList />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <h2 className="text-2xl font-semibold">Invoice Generator</h2>
            <p className="text-muted-foreground">Invoice generation coming soon...</p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
