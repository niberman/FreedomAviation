export interface InstructionInvoice {
  id: string;
  owner_id: string;
  aircraft_id: string;
  invoice_number: string;
  amount: number;
  status: string;
  category: string;
  created_by_cfi_id: string;
  created_at: string;
  due_date?: string | null;
  paid_date?: string | null;
  aircraft?: { tail_number: string };
  owner?: { full_name: string; email: string };
  invoice_lines?: Array<{
    description: string;
    quantity: number;
    unit_cents: number;
  }>;
}
















