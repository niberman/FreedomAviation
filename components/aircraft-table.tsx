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

interface Aircraft {
  id: string;
  tailNumber: string;
  make: string;
  model: string;
  class: string;
  baseAirport: string;
  owner: string;
}

export function AircraftTable() {
  const [baseFilter, setBaseFilter] = useState<string>("all");

  // TODO: remove mock functionality
  const aircraft: Aircraft[] = [
    {
      id: "1",
      tailNumber: "N847SR",
      make: "Cirrus",
      model: "SR22T",
      class: "Class II",
      baseAirport: "KAPA",
      owner: "Sarah Mitchell",
    },
    {
      id: "2",
      tailNumber: "N123JA",
      make: "Cirrus",
      model: "Vision Jet",
      class: "Class III",
      baseAirport: "KAPA",
      owner: "James Anderson",
    },
    {
      id: "3",
      tailNumber: "N456AB",
      make: "Cessna",
      model: "182T",
      class: "Class I",
      baseAirport: "KAPA",
      owner: "Mike Thompson",
    },
  ];

  const filteredAircraft =
    baseFilter === "all"
      ? aircraft
      : aircraft.filter((a) => a.baseAirport === baseFilter);

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
            {filteredAircraft.map((aircraft) => (
              <TableRow
                key={aircraft.id}
                data-testid={`aircraft-row-${aircraft.id}`}
              >
                <TableCell className="font-mono font-semibold">
                  {aircraft.tailNumber}
                </TableCell>
                <TableCell>
                  {aircraft.make} {aircraft.model}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{aircraft.class}</Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {aircraft.baseAirport}
                </TableCell>
                <TableCell>{aircraft.owner}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => console.log("Create readiness task")}
                      data-testid={`button-readiness-${aircraft.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => console.log("Top-off consumable")}
                      data-testid={`button-topoff-${aircraft.id}`}
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => console.log("Update avionics DB")}
                      data-testid={`button-db-update-${aircraft.id}`}
                    >
                      <Database className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
