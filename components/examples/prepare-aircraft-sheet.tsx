import { PrepareAircraftSheet } from "../prepare-aircraft-sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PrepareAircraftSheetExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Prepare Sheet</Button>
      <PrepareAircraftSheet
        open={open}
        onOpenChange={setOpen}
        aircraft={{ tailNumber: "N847SR", make: "Cirrus", model: "SR22T" }}
      />
    </div>
  );
}
