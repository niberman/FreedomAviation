// @vitest-environment jsdom
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StaffDashboard from './staff-dashboard';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
const mockSearch = vi.fn(() => '');

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    in: vi.fn(() => mockSupabase),
    rpc: vi.fn(),
    maybeSingle: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  };
  return {
    supabase: mockSupabase,
  };
});
vi.mock('@/lib/auth-context');
vi.mock('@/hooks/use-toast');
vi.mock('wouter', async () => {
  const actual = await vi.importActual<any>('wouter');
  return {
    ...actual,
    useSearch: () => mockSearch(),
    Link: ({ href, children, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});
vi.mock('@/components/kanban-board', () => ({
  KanbanBoard: ({ items }: { items: any[] }) => (
    <div data-testid="kanban-board">
      {items.map((item) => (
        <div key={item.id} data-testid={`kanban-item-${item.id}`}>
          {item.tailNumber} - {item.status}
        </div>
      ))}
    </div>
  ),
}));
vi.mock('@/components/aircraft-table', () => ({
  AircraftTable: ({
    items,
    owners,
    onAircraftCreated,
  }: {
    items: any[];
    owners?: any[];
    onAircraftCreated?: () => void;
  }) => (
    <div data-testid="aircraft-table">
      {items.map((item) => (
        <div key={item.id} data-testid={`aircraft-${item.id}`}>
          {item.tailNumber}
        </div>
      ))}
      <div data-testid="aircraft-owners-count">
        {owners ? owners.length : 0}
      </div>
      <button
        data-testid="aircraft-mock-create"
        onClick={() => onAircraftCreated && onAircraftCreated()}
      >
        trigger-create
      </button>
    </div>
  ),
}));
vi.mock('@/components/maintenance-list', () => ({
  MaintenanceList: ({ items }: { items: any[] }) => (
    <div data-testid="maintenance-list">
      {items.map((item) => (
        <div key={item.id} data-testid={`maintenance-${item.id}`}>
          {item.tailNumber} - {item.status}
        </div>
      ))}
    </div>
  ),
}));
vi.mock('@/components/clients-table', () => ({
  ClientsTable: () => <div data-testid="clients-table">Clients Table</div>,
}));

const mockToast = vi.fn();
const mockStaffUser = { id: 'staff-123', email: 'staff@test.com' };
const mockOwnerUser = { id: 'owner-123', email: 'owner@test.com' };

describe('StaffDashboard - Owner-Staff Interactions', () => {
  let queryClient: QueryClient;
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearch.mockReturnValue('');
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useAuth as any).mockReturnValue({ user: mockStaffUser });
    (useToast as any).mockReturnValue({ toast: mockToast });

    // Get the mocked supabase instance
    const supabaseModule = await import('@/lib/supabase');
    mockSupabase = supabaseModule.supabase;

    // Reset chained query methods to known defaults between tests
    const chainMethods: Array<keyof typeof mockSupabase> = ['from', 'select', 'insert', 'update', 'eq'];
    chainMethods.forEach((method) => {
      if (typeof mockSupabase[method]?.mockReset === 'function') {
        mockSupabase[method].mockReset();
        mockSupabase[method].mockImplementation(() => mockSupabase);
      }
    });

    if (typeof mockSupabase.order?.mockReset === 'function') {
      mockSupabase.order.mockReset();
      mockSupabase.order.mockImplementation(async () => ({ data: [], error: null }));
    }

    if (typeof mockSupabase.in?.mockReset === 'function') {
      mockSupabase.in.mockReset();
      mockSupabase.in.mockImplementation(async () => ({ data: [], error: null }));
    }

    if (typeof mockSupabase.rpc?.mockReset === 'function') {
      mockSupabase.rpc.mockReset();
    }

    if (typeof mockSupabase.maybeSingle?.mockReset === 'function') {
      mockSupabase.maybeSingle.mockReset();
    }

    if (typeof mockSupabase.auth?.getUser?.mockReset === 'function') {
      mockSupabase.auth.getUser.mockReset();
    }

    if (typeof mockSupabase.auth?.getSession?.mockReset === 'function') {
      mockSupabase.auth.getSession.mockReset();
    }

    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { origin: 'http://localhost:3000', hostname: 'localhost' },
    });

    // Mock fetch for email API
    global.fetch = vi.fn();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Service Request Viewing', () => {
    it('should honor tab query and open staff tab', async () => {
      mockSearch.mockReturnValue('tab=staff');

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-staff')).toHaveAttribute('data-state', 'active');
      });
    });

    it('should fetch and display service requests from owners', async () => {
      const mockServiceRequests = [
        {
          id: 'request-1',
          service_type: 'Pre-Flight Concierge',
          status: 'pending',
          aircraft: { tail_number: 'N123FA' },
          owner: { full_name: 'John Doe', email: 'john@test.com' },
          requested_departure: '2024-01-15T10:00:00',
          description: 'Need fuel',
        },
      ];

      // Mock REST endpoint instead of Supabase query
      vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url === '/api/service-requests' && (!init || init.method === 'GET')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ serviceRequests: mockServiceRequests }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ) as any,
          );
        }
        // Fallback empty response
        return Promise.resolve(
          new Response(JSON.stringify({ serviceRequests: [] }), { status: 200 }) as any,
        );
      });

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Service Requests/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Aircraft Viewing', () => {
    it('should fetch and display all aircraft with owner options', async () => {
      const mockOwners = [
        {
          id: 'owner-1',
          full_name: 'Aviator One',
          email: 'owner1@test.com',
        },
      ];
      const mockAircraft = [
        {
          id: 'aircraft-1',
          tail_number: 'N123FA',
          make: 'Cirrus',
          model: 'SR22T',
          class: 'class_i',
          base_location: 'KAPA',
          owner_id: 'owner-123',
          owner: { full_name: 'John Doe', email: 'john@test.com' },
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order
        .mockResolvedValueOnce({
          data: mockOwners,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockAircraft,
          error: null,
        });

      // Mock user profile
      mockSupabase.maybeSingle = vi.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-aircraft')).toBeInTheDocument();
      });

      const aircraftTab = screen.getByTestId('tab-aircraft');
      await userEvent.click(aircraftTab);

      await waitFor(() => {
        expect(screen.getByTestId('aircraft-table')).toBeInTheDocument();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('aircraft');
      expect(screen.getByTestId('aircraft-owners-count')).toHaveTextContent('1');
    });
  });

  describe('Maintenance Viewing', () => {
    it('should fetch and display maintenance items', async () => {
      const mockMaintenance = [
        {
          id: 'maintenance-1',
          aircraft_id: 'aircraft-123',
          item: 'Annual Inspection',
          due_at_date: '2024-06-01',
          severity: 'medium',
          aircraft: { tail_number: 'N123FA', hobbs_hours: 500 },
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValueOnce({
        data: mockMaintenance,
        error: null,
      });

      // Mock aircraft query for hobbs
      mockSupabase.in = vi.fn().mockReturnValue({
        data: [{ id: 'aircraft-123', hobbs_hours: 500 }],
        error: null,
      });

      // Mock user profile
      mockSupabase.maybeSingle = vi.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-maintenance')).toBeInTheDocument();
      });

      const maintenanceTab = screen.getByTestId('tab-maintenance');
      await userEvent.click(maintenanceTab);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('maintenance_due');
      });
    });
  });
});

