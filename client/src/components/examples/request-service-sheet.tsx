import { RequestServiceSheet } from "../request-service-sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function RequestServiceSheetExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Service Request</Button>
      <RequestServiceSheet 
        open={open} 
        onOpenChange={setOpen}
        aircraft={{ tailNumber: "N847SR", make: "Cirrus", model: "SR22T" }}
      />
    </div>
  );
}
