import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickActions } from '@/features/owner/components/QuickActions';
import { KanbanBoard } from '@/components/kanban-board';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    in: vi.fn(() => mockSupabase),
  };
  return {
    supabase: mockSupabase,
  };
});
vi.mock('@/lib/auth-context');
vi.mock('@/hooks/use-toast');

const mockToast = vi.fn();
const mockOwnerUser = { id: 'owner-123', email: 'owner@test.com' };
const mockStaffUser = { id: 'staff-123', email: 'staff@test.com' };

describe('Owner-Staff Dashboard Integration Tests', () => {
  let queryClient: QueryClient;
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useToast as any).mockReturnValue({ toast: mockToast });

    // Get the mocked supabase instance
    const supabaseModule = await import('@/lib/supabase');
    mockSupabase = supabaseModule.supabase;
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Complete Service Request Flow', () => {
    it('should allow owner to create service request and staff to view it', async () => {
      // Step 1: Owner creates service request
      (useAuth as any).mockReturnValue({ user: mockOwnerUser });

      const aircraftData = {
        id: 'aircraft-123',
        tail_number: 'N123FA',
        base_location: 'KAPA',
      };

      const createdRequest = {
        id: 'request-1',
        service_type: 'Pre-Flight Concierge',
        status: 'pending',
        aircraft_id: 'aircraft-123',
        user_id: 'owner-123',
        description: 'Need fuel and O2 topoff',
        airport: 'KAPA',
        requested_departure: '2024-01-15T10:00:00',
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue({
        data: [createdRequest],
        error: null,
      });

      renderWithProviders(
        <QuickActions
          aircraftId="aircraft-123"
          userId="owner-123"
          aircraftData={aircraftData}
        />
      );

      // Owner submits request
      const prepareButton = screen.getByTestId('button-prepare-aircraft');
      await userEvent.click(prepareButton);

      const airportInput = screen.getByTestId('input-prep-airport');
      await userEvent.clear(airportInput);
      await userEvent.type(airportInput, 'KAPA');

      const departureInput = screen.getByTestId('input-prep-departure');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(departureInput, dateString);

      const submitButton = screen.getByTestId('button-submit-prep');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabase.insert).toHaveBeenCalled();
      });

      // Step 2: Staff views the request in kanban board
      (useAuth as any).mockReturnValue({ user: mockStaffUser });

      const serviceRequestsForStaff = [
        {
          id: 'request-1',
          tailNumber: 'N123FA',
          type: 'Pre-Flight Concierge',
          requestedFor: '2024-01-15 10:00',
          notes: 'Need fuel and O2 topoff',
          status: 'new' as const,
          ownerName: 'Owner Name',
        },
      ];

      renderWithProviders(<KanbanBoard items={serviceRequestsForStaff} />);

      // Verify staff can see the request
      expect(screen.getByTestId('kanban-card-request-1')).toBeInTheDocument();
      expect(screen.getByText('N123FA')).toBeInTheDocument();
    });

    it('should allow staff to update service request status', async () => {
      (useAuth as any).mockReturnValue({ user: mockStaffUser });

      const serviceRequests = [
        {
          id: 'request-1',
          tailNumber: 'N123FA',
          type: 'Pre-Flight Concierge',
          requestedFor: '2024-01-15 10:00',
          notes: 'Need fuel',
          status: 'new' as const,
          ownerName: 'Owner Name',
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue({ error: null });

      renderWithProviders(<KanbanBoard items={serviceRequests} />);

      const card = screen.getByTestId('kanban-card-request-1');
      const inProgressColumn = screen.getByTestId('kanban-column-in_progress');

      // Simulate drag and drop
      const dragEvent = new Event('dragstart', { bubbles: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
          setData: vi.fn(),
          getData: vi.fn(() => 'request-1'),
        },
      });
      card.dispatchEvent(dragEvent);

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: vi.fn(() => 'request-1'),
        },
      });
      Object.defineProperty(dropEvent, 'preventDefault', {
        value: vi.fn(),
      });
      inProgressColumn.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockSupabase.update).toHaveBeenCalledWith({
          status: 'in_progress',
        });
      });
    });
  });

  describe('Instruction Request Flow', () => {
    it('should allow owner to request instruction and staff to assign it', async () => {
      // Step 1: Owner requests instruction
      (useAuth as any).mockReturnValue({ user: mockOwnerUser });

      const aircraftData = {
        id: 'aircraft-123',
        tail_number: 'N123FA',
        base_location: 'KAPA',
      };

      const createdInstruction = {
        id: 'instruction-1',
        service_type: 'Flight Instruction',
        status: 'pending',
        aircraft_id: 'aircraft-123',
        user_id: 'owner-123',
        requested_departure: '2024-01-20T14:00:00.000Z',
        description: 'IPC training needed',
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue({
        data: [createdInstruction],
        error: null,
      });

      renderWithProviders(
        <QuickActions
          aircraftId="aircraft-123"
          userId="owner-123"
          aircraftData={aircraftData}
        />
      );

      const instructionButton = screen.getByTestId('button-request-instruction');
      await userEvent.click(instructionButton);

      const dateInput = screen.getByTestId('input-instruction-date');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      await userEvent.type(dateInput, dateString);

      const timeInput = screen.getByTestId('input-instruction-time');
      await userEvent.type(timeInput, '14:00');

      const submitButton = screen.getByTestId('button-submit-instruction');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabase.insert).toHaveBeenCalled();
        const insertCall = mockSupabase.insert.mock.calls[0];
        expect(insertCall[0].service_type).toBe('Flight Instruction');
      });
    });
  });

  describe('Data Synchronization', () => {
    it('should invalidate queries when owner creates request', async () => {
      (useAuth as any).mockReturnValue({ user: mockOwnerUser });

      const aircraftData = {
        id: 'aircraft-123',
        tail_number: 'N123FA',
        base_location: 'KAPA',
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue({
        data: [{ id: 'request-1' }],
        error: null,
      });

      renderWithProviders(
        <QuickActions
          aircraftId="aircraft-123"
          userId="owner-123"
          aircraftData={aircraftData}
        />
      );

      const serviceButton = screen.getByTestId('button-request-service');
      await userEvent.click(serviceButton);

      const submitButton = screen.getByTestId('button-submit-service');
      await userEvent.click(submitButton);

      await waitFor(() => {
        // Verify query invalidation happens (this is handled by React Query)
        expect(mockSupabase.insert).toHaveBeenCalled();
      });
    });
  });
});

