import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText } from "lucide-react";
import logoImage from "@assets/freedom-aviation-logo.png";

export default function CFIDashboard() {
  // TODO: remove mock functionality
  const reservations = [
    { id: "1", date: "2024-10-15 10:00", student: "John Doe", aircraft: "N847SR", type: "IPC" },
    { id: "2", date: "2024-10-16 14:00", student: "Jane Smith", aircraft: "N123JA", type: "BFR" },
  ];

  const flightLogs = [
    { id: "1", date: "2024-10-14", student: "Mike Johnson", aircraft: "N456AB", hobbsStart: 1200, hobbsEnd: 1202.5, notes: "Pattern work, 5 landings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Freedom Aviation" className="h-8 w-auto" />
            <h1 className="text-xl font-semibold">Freedom Aviation - CFI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-8">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Flight Logs</TabsTrigger>
            <TabsTrigger value="tracking" data-testid="tab-tracking">IPC/BFR Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Schedule</h2>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <Card key={reservation.id} data-testid={`reservation-${reservation.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{reservation.student}</p>
                        <p className="text-sm text-muted-foreground">{reservation.date}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="font-mono">{reservation.aircraft}</Badge>
                          <Badge variant="secondary">{reservation.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Flight Logs</h2>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-3">
              {flightLogs.map((log) => (
                <Card key={log.id} data-testid={`log-${log.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{log.student}</CardTitle>
                        <p className="text-sm text-muted-foreground">{log.date}</p>
                      </div>
                      <Badge variant="outline" className="font-mono">{log.aircraft}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Hobbs Start</p>
                        <p className="font-mono font-semibold">{log.hobbsStart}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hobbs End</p>
                        <p className="font-mono font-semibold">{log.hobbsEnd}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{log.notes}</p>
                    <Button size="sm" data-testid={`button-sign-${log.id}`}>Sign Off</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <h2 className="text-2xl font-semibold">IPC/BFR Tracking</h2>
            <p className="text-muted-foreground">Currency tracking coming soon...</p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
