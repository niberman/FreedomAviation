import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench, Plus, Database } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Aircraft {
  id: string; // UUID from public.aircraft.id
  tailNumber: string;
  make: string;
  model: string;
  class: string;
  baseAirport: string; // maps to aircraft.base_location
  owner: string; // display only
}

export function AircraftTable({ items }: { items: Aircraft[] }) {
  const [baseFilter, setBaseFilter] = useState<string>("all");

  const filteredAircraft =
    baseFilter === "all"
      ? items
      : items.filter((a) => a.baseAirport === baseFilter);

  async function createReadinessTask(aircraftId: string) {
    // service_tasks: aircraft_id (uuid) NOT NULL, type text NOT NULL, status default 'pending'
    await supabase
      .from("service_tasks")
      .insert([
        {
          aircraft_id: aircraftId,
          type: "readiness",
          status: "pending",
          notes: "Created from dashboard",
        },
      ]);
  }

  async function topOffOil(aircraftId: string) {
    // consumable_events requires: aircraft_id, kind ('OIL'|'O2'|'TKS')
    await supabase
      .from("consumable_events")
      .insert([
        {
          aircraft_id: aircraftId,
          kind: "OIL",
          quantity: 2,
          unit: "qt",
          notes: "Top-off request",
        },
      ]);
  }

  async function markAvionicsDbUpdate(aircraftId: string) {
    await supabase
      .from("service_tasks")
      .insert([
        {
          aircraft_id: aircraftId,
          type: "avionics_db_update",
          status: "pending",
        },
      ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Aircraft Inventory</h3>
        <Select value={baseFilter} onValueChange={setBaseFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-base-filter">
            <SelectValue placeholder="Filter by base" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bases</SelectItem>
            <SelectItem value="KAPA">KAPA</SelectItem>
            <SelectItem value="KBJC">KBJC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tail Number</TableHead>
              <TableHead>Aircraft</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAircraft.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No aircraft at this base yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredAircraft.map((a) => (
                <TableRow key={a.id} data-testid={`aircraft-row-${a.id}`}>
                  <TableCell className="font-mono font-semibold">
                    {a.tailNumber}
                  </TableCell>
                  <TableCell>
                    {a.make} {a.model}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.class}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{a.baseAirport}</TableCell>
                  <TableCell>{a.owner}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => createReadinessTask(a.id)}
                        data-testid={`button-readiness-${a.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => topOffOil(a.id)}
                        data-testid={`button-topoff-${a.id}`}
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => markAvionicsDbUpdate(a.id)}
                        data-testid={`button-db-update-${a.id}`}
                      >
                        <Database className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
