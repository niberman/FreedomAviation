import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SimplePricingCalculator } from "./simple-pricing-calculator";

interface SimpleCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimpleCalculatorDialog({ open, onOpenChange }: SimpleCalculatorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get Your Quote</DialogTitle>
          <DialogDescription>
            Simple, transparent pricing in 2 steps
          </DialogDescription>
        </DialogHeader>
        <SimplePricingCalculator onQuoteGenerated={() => setTimeout(() => onOpenChange(false), 1500)} />
      </DialogContent>
    </Dialog>
  );
}


