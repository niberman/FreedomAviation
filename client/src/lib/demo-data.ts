// Demo data fixtures for isolated demo mode
// This data is used when viewing /demo?readonly=1&seed=DEMO

export const DEMO_USER = {
  id: "demo-user-id",
  email: "demo@freedomaviationco.com",
  created_at: "2024-01-15T10:00:00Z"
};

export const DEMO_AIRCRAFT = {
  id: "demo-aircraft-1",
  owner_id: DEMO_USER.id,
  tail_number: "N847SR",
  make: "Cirrus",
  model: "SR22T",
  year: 2021,
  base_location: "KAPA",
  service_class: "Class II",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z"
};

export const DEMO_MEMBERSHIP = {
  id: "demo-membership-1",
  owner_id: DEMO_USER.id,
  tier: "Class II - High Performance",
  monthly_rate: 550,
  is_active: true,
  start_date: "2024-01-15",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z"
};

export const DEMO_NEXT_FLIGHT = {
  id: "demo-flight-1",
  user_id: DEMO_USER.id,
  aircraft_id: DEMO_AIRCRAFT.id,
  service_type: "Pre-Flight Concierge",
  status: "scheduled",
  requested_departure: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  destination: "KCOS",
  fuel_requested: 75,
  notes: "Weekend trip to Colorado Springs",
  created_at: "2024-10-14T08:00:00Z",
  updated_at: "2024-10-14T08:00:00Z"
};

export const DEMO_SERVICE_REQUESTS = [
  {
    id: "demo-sr-1",
    user_id: DEMO_USER.id,
    aircraft_id: DEMO_AIRCRAFT.id,
    service_type: "Pre-Flight Concierge",
    status: "completed",
    requested_departure: "2024-10-13T14:00:00Z",
    destination: "KDEN",
    fuel_requested: 60,
    notes: "Quick hop to Denver",
    created_at: "2024-10-12T16:00:00Z",
    updated_at: "2024-10-13T12:00:00Z"
  },
  {
    id: "demo-sr-2",
    user_id: DEMO_USER.id,
    aircraft_id: DEMO_AIRCRAFT.id,
    service_type: "Detail Service",
    status: "completed",
    notes: "Full interior and exterior detail",
    created_at: "2024-10-10T09:00:00Z",
    updated_at: "2024-10-10T15:00:00Z"
  },
  {
    id: "demo-sr-3",
    user_id: DEMO_USER.id,
    aircraft_id: DEMO_AIRCRAFT.id,
    service_type: "Maintenance Coordination",
    status: "in_progress",
    notes: "Annual inspection coordination with maintenance shop",
    created_at: "2024-10-08T11:00:00Z",
    updated_at: "2024-10-14T10:00:00Z"
  }
];

export const DEMO_SERVICE_TASKS = [
  {
    id: "demo-task-1",
    aircraft_id: DEMO_AIRCRAFT.id,
    type: "Pre-Flight Check",
    status: "completed",
    assigned_to: "Operations Team",
    notes: "Aircraft ready for departure to KCOS",
    photos: [],
    completed_at: "2024-10-14T07:30:00Z",
    created_at: "2024-10-14T06:00:00Z",
    updated_at: "2024-10-14T07:30:00Z"
  },
  {
    id: "demo-task-2",
    aircraft_id: DEMO_AIRCRAFT.id,
    type: "Detail",
    status: "completed",
    assigned_to: "Detail Team",
    notes: "Full exterior wash and interior vacuum completed",
    photos: [],
    completed_at: "2024-10-10T14:30:00Z",
    created_at: "2024-10-10T09:00:00Z",
    updated_at: "2024-10-10T14:30:00Z"
  },
  {
    id: "demo-task-3",
    aircraft_id: DEMO_AIRCRAFT.id,
    type: "Fuel Service",
    status: "completed",
    assigned_to: "Line Service",
    notes: "Topped to 75 gallons as requested",
    photos: [],
    completed_at: "2024-10-13T11:00:00Z",
    created_at: "2024-10-13T10:00:00Z",
    updated_at: "2024-10-13T11:00:00Z"
  }
];

export const DEMO_INVOICES = [
  {
    id: "demo-invoice-1",
    aircraft_id: DEMO_AIRCRAFT.id,
    owner_id: DEMO_USER.id,
    invoice_number: "INV-2024-10-001",
    amount: 550.00,
    status: "paid",
    due_date: "2024-10-01",
    paid_date: "2024-09-28",
    line_items: [
      { description: "Class II Monthly Service", quantity: 1, unit_price: 550.00, total: 550.00 }
    ],
    created_at: "2024-09-25T10:00:00Z",
    updated_at: "2024-09-28T14:00:00Z"
  },
  {
    id: "demo-invoice-2",
    aircraft_id: DEMO_AIRCRAFT.id,
    owner_id: DEMO_USER.id,
    invoice_number: "INV-2024-09-001",
    amount: 550.00,
    status: "paid",
    due_date: "2024-09-01",
    paid_date: "2024-08-29",
    line_items: [
      { description: "Class II Monthly Service", quantity: 1, unit_price: 550.00, total: 550.00 }
    ],
    created_at: "2024-08-25T10:00:00Z",
    updated_at: "2024-08-29T14:00:00Z"
  },
  {
    id: "demo-invoice-3",
    aircraft_id: DEMO_AIRCRAFT.id,
    owner_id: DEMO_USER.id,
    invoice_number: "INV-2024-08-001",
    amount: 550.00,
    status: "paid",
    due_date: "2024-08-01",
    paid_date: "2024-07-30",
    line_items: [
      { description: "Class II Monthly Service", quantity: 1, unit_price: 550.00, total: 550.00 }
    ],
    created_at: "2024-07-25T10:00:00Z",
    updated_at: "2024-07-30T14:00:00Z"
  }
];
