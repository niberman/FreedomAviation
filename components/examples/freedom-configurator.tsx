import { FreedomConfigurator } from "../freedom-configurator";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function FreedomConfiguratorExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Configurator</Button>
      <FreedomConfigurator open={open} onOpenChange={setOpen} />
    </div>
  );
}
