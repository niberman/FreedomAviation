import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreateSession, mockRequireRole, mockCreateAdminClient } = vi.hoisted(() => ({
  mockCreateSession: vi.fn(),
  mockRequireRole: vi.fn(),
  mockCreateAdminClient: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = { sessions: { create: mockCreateSession } };
    webhooks = { constructEvent: vi.fn() };
    constructor(_key: string) {}
  },
}));

vi.mock('@/lib/api-auth', () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock('@/lib/supabase-server', () => ({
  createAdminClient: () => mockCreateAdminClient(),
  isSupabaseConfigured: () => true,
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: class {},
}));

import { POST } from './route';

interface MockEntry {
  data?: unknown;
  error?: unknown;
  single?: { data?: unknown; error?: unknown };
}
interface MockHandlers {
  select?: Record<string, MockEntry>;
  insert?: Record<string, MockEntry>;
  update?: Record<string, MockEntry>;
  delete?: Record<string, MockEntry>;
}

function createMockSupabase(handlers: MockHandlers = {}) {
   
  const chain: any = {};
  let currentTable = '';
  let currentOp: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let usedSingle = false;

  const resolve = () => {
    const bucket = (handlers as Record<string, Record<string, MockEntry> | undefined>)[currentOp];
    const h = bucket?.[currentTable];
    if (!h) return { data: null, error: null };
    if (usedSingle) return h.single ?? { data: null, error: null };
    return { data: h.data ?? null, error: h.error ?? null };
  };

  chain.from = vi.fn((t: string) => {
    currentTable = t;
    currentOp = 'select';
    usedSingle = false;
    return chain;
  });
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => {
    currentOp = 'insert';
    return chain;
  });
  chain.update = vi.fn(() => {
    currentOp = 'update';
    return chain;
  });
  chain.delete = vi.fn(() => {
    currentOp = 'delete';
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.single = vi.fn(() => {
    usedSingle = true;
    return chain;
  });

  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(resolve()).then(onFulfilled, onRejected);

  return chain;
}

 
const asRequest = (body: unknown) => ({ json: async () => body } as any);

interface TestInvoice {
  id: string;
  owner_id: string;
  invoice_number: string;
  status: string;
  paid_date: string | null;
  amount: number;
  batch_id: string | null;
  invoice_lines: Array<{ description: string; quantity: number; unit_cents: number }>;
}

const makeInvoice = (overrides: Partial<TestInvoice>): TestInvoice => ({
  id: 'i1',
  owner_id: 'u1',
  invoice_number: 'INV-1',
  status: 'finalized',
  paid_date: null,
  amount: 100,
  batch_id: null,
  invoice_lines: [{ description: 'Line', quantity: 1, unit_cents: 10000 }],
  ...overrides,
});

describe('POST /api/invoices/send-batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      ok: true,
      auth: { user: { id: 'staff-1' } },
    });
    mockCreateAdminClient.mockReturnValue(createMockSupabase());
  });

  it('rejects requests with fewer than 2 invoice IDs', async () => {
    const res = await POST(asRequest({ invoiceIds: ['i1'] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/at least 2/i);
  });

  it('rejects invoices belonging to different owners', async () => {
    mockCreateAdminClient.mockReturnValue(
      createMockSupabase({
        select: {
          invoices: {
            data: [
              makeInvoice({ id: 'i1', owner_id: 'u1' }),
              makeInvoice({ id: 'i2', owner_id: 'u2' }),
            ],
          },
        },
      }),
    );
    const res = await POST(asRequest({ invoiceIds: ['i1', 'i2'] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/same owner/i);
  });

  it('rejects when any invoice is already paid', async () => {
    mockCreateAdminClient.mockReturnValue(
      createMockSupabase({
        select: {
          invoices: {
            data: [
              makeInvoice({ id: 'i1' }),
              makeInvoice({ id: 'i2', status: 'paid', paid_date: '2026-04-01' }),
            ],
          },
        },
      }),
    );
    const res = await POST(asRequest({ invoiceIds: ['i1', 'i2'] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already paid/i);
  });

  it('rejects invoices already linked to a batch', async () => {
    mockCreateAdminClient.mockReturnValue(
      createMockSupabase({
        select: {
          invoices: {
            data: [
              makeInvoice({ id: 'i1' }),
              makeInvoice({ id: 'i2', batch_id: 'batch-old' }),
            ],
          },
        },
      }),
    );
    const res = await POST(asRequest({ invoiceIds: ['i1', 'i2'] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already part of an open batch/i);
  });

  it('happy path: creates batch, aggregates line items, returns payment URL', async () => {
    mockCreateAdminClient.mockReturnValue(
      createMockSupabase({
        select: {
          invoices: {
            data: [
              makeInvoice({
                id: 'i1',
                invoice_number: 'INV-1',
                invoice_lines: [{ description: 'Lesson', quantity: 1, unit_cents: 10000 }],
              }),
              makeInvoice({
                id: 'i2',
                invoice_number: 'INV-2',
                invoice_lines: [{ description: 'Oil change', quantity: 2, unit_cents: 5000 }],
              }),
            ],
          },
          user_profiles: {
            single: {
              data: { id: 'u1', full_name: 'User One', email: 'user@example.com' },
            },
          },
        },
        insert: { invoice_batches: { single: { data: { id: 'batch-1' } } } },
        update: { invoices: {}, invoice_batches: {} },
      }),
    );
    mockCreateSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/cs_test_123',
    });

    const res = await POST(asRequest({ invoiceIds: ['i1', 'i2'] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.batchId).toBe('batch-1');
    expect(body.paymentUrl).toBe('https://checkout.stripe.com/cs_test_123');
    expect(body.totalAmount).toBe(200);
    expect(body.invoiceCount).toBe(2);

    expect(mockCreateSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mockCreateSession.mock.calls[0][0];
    expect(sessionArgs.metadata.batch_id).toBe('batch-1');
    expect(sessionArgs.metadata.invoice_ids).toBe('i1,i2');
    expect(sessionArgs.customer_email).toBe('user@example.com');
    expect(sessionArgs.line_items).toHaveLength(2);
    expect(sessionArgs.line_items[0].price_data.product_data.name).toContain('INV-1');
    expect(sessionArgs.line_items[1].price_data.product_data.name).toContain('INV-2');
  });
});
