// Demo data for showcasing the application

export const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@freedomaviationco.com',
  user_metadata: {
    full_name: 'Demo Pilot',
  },
};

export const DEMO_AIRCRAFT = {
  id: 'demo-aircraft-id',
  tail_number: 'N123FA',
  make: 'Cirrus',
  model: 'SR22T',
  year: 2022,
  class: 'single-engine',
  base_location: 'KAPA',
  owner_id: 'demo-user-id',
  has_tks: true,
  has_oxygen: true,
  hobbs_hours: 1234.5,
  tach_hours: 1200.2,
};

export const DEMO_MEMBERSHIP = {
  id: 'demo-membership-id',
  owner_id: 'demo-user-id',
  tier: 'Class II',
  is_active: true,
  start_date: '2024-01-01',
  monthly_rate: 550,
};

export const DEMO_SERVICE_REQUESTS = [
  {
    id: 'demo-request-1',
    user_id: 'demo-user-id',
    aircraft_id: 'demo-aircraft-id',
    service_type: 'Pre-Flight Concierge',
    status: 'pending',
    requested_departure: new Date().toISOString(),
    description: 'Pull aircraft, check fuel, tow to ramp',
    created_at: new Date().toISOString(),
  },
];

export const DEMO_SERVICE_TASKS = [
  {
    id: 'demo-task-1',
    aircraft_id: 'demo-aircraft-id',
    type: 'readiness',
    status: 'completed',
    assigned_to: null,
    notes: 'Aircraft ready for flight',
    photos: [],
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEMO_INVOICES = [
  {
    id: 'demo-invoice-1',
    owner_id: 'demo-user-id',
    invoice_number: 'INV-2024-001',
    amount: 550,
    status: 'paid',
    due_date: '2024-01-15',
    paid_date: '2024-01-10',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'demo-invoice-2',
    owner_id: 'demo-user-id',
    invoice_number: 'INV-2024-002',
    amount: 550,
    status: 'finalized',
    due_date: '2024-02-15',
    paid_date: null,
    created_at: '2024-02-01T00:00:00Z',
  },
];
