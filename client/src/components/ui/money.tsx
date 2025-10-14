import { cn } from "@/lib/utils";

interface MoneyProps {
  amount: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
}

export function Money({ amount, currency = "USD", className, showSign = false }: MoneyProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = showSign && amount > 0 ? "+" : "";
  const negative = amount < 0 ? "-" : "";

  return (
    <span 
      className={cn(
        "font-mono tabular-nums",
        amount < 0 && "text-destructive",
        amount > 0 && showSign && "text-green-600 dark:text-green-400",
        className
      )}
      data-testid="money-amount"
    >
      {negative}{sign}{formatted}
    </span>
  );
}

interface CreditAmountProps {
  credits: number;
  className?: string;
  showSign?: boolean;
}

export function CreditAmount({ credits, className, showSign = false }: CreditAmountProps) {
  const sign = showSign && credits > 0 ? "+" : "";
  const negative = credits < 0 ? "-" : "";
  const absValue = Math.abs(credits);

  return (
    <span 
      className={cn(
        "font-semibold tabular-nums",
        credits < 0 && "text-destructive",
        credits > 0 && showSign && "text-green-600 dark:text-green-400",
        className
      )}
      data-testid="credit-amount"
    >
      {negative}{sign}{absValue} {absValue === 1 ? "credit" : "credits"}
    </span>
  );
}
