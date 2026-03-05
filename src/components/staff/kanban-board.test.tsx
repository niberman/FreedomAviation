import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KanbanBoard } from './kanban-board';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => ({ error: null })),
  };
  return {
    supabase: mockSupabase,
  };
});
vi.mock('@/hooks/use-toast');

const mockToast = vi.fn();

describe('KanbanBoard - Staff Dashboard Service Request Management', () => {
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

  const mockServiceRequests = [
    {
      id: 'request-1',
      tailNumber: 'N123FA',
      type: 'Pre-Flight Concierge',
      requestedFor: '2024-01-15 10:00',
      notes: 'Need fuel and O2 topoff',
      status: 'new' as const,
      ownerName: 'John Doe',
    },
    {
      id: 'request-2',
      tailNumber: 'N456FA',
      type: 'Flight Instruction',
      requestedFor: '2024-01-16 14:00',
      notes: 'IPC training',
      status: 'in_progress' as const,
      ownerName: 'Jane Smith',
    },
    {
      id: 'request-3',
      tailNumber: 'N789FA',
      type: 'Full Detail',
      requestedFor: '2024-01-17 09:00',
      notes: 'Full detail service',
      status: 'done' as const,
      ownerName: 'Bob Johnson',
    },
  ];

  it('should display service requests in correct columns', () => {
    renderWithProviders(<KanbanBoard items={mockServiceRequests} />);

    // Check new column
    expect(screen.getByTestId('kanban-column-new')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-card-request-1')).toBeInTheDocument();

    // Check in_progress column
    expect(screen.getByTestId('kanban-column-in_progress')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-card-request-2')).toBeInTheDocument();

    // Check done column
    expect(screen.getByTestId('kanban-column-done')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-card-request-3')).toBeInTheDocument();
  });

  it('should update service request status when dragged to different column', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue({ error: null });

    renderWithProviders(<KanbanBoard items={mockServiceRequests} />);

    const card = screen.getByTestId('kanban-card-request-1');
    const inProgressColumn = screen.getByTestId('kanban-column-in_progress');

    // Simulate drag and drop
    await act(async () => {
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
    });

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('service_requests');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'in_progress' });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'request-1');
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Status updated',
        })
      );
    });
  });

  it('should map kanban statuses to database statuses correctly', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue({ error: null });

    renderWithProviders(<KanbanBoard items={mockServiceRequests} />);

    const card = screen.getByTestId('kanban-card-request-1');
    const doneColumn = screen.getByTestId('kanban-column-done');

    // Drag to done column
    await act(async () => {
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
      doneColumn.dispatchEvent(dropEvent);
    });

    await waitFor(() => {
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'completed' });
    });
  });

  it('should handle drag and drop errors gracefully', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue({ error: new Error('Database error') });

    renderWithProviders(<KanbanBoard items={mockServiceRequests} />);

    const card = screen.getByTestId('kanban-card-request-1');
    const inProgressColumn = screen.getByTestId('kanban-column-in_progress');

    await act(async () => {
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
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });
  });

  it('should display service request details correctly', () => {
    renderWithProviders(<KanbanBoard items={mockServiceRequests} />);

    const card = screen.getByTestId('kanban-card-request-1');
    expect(card).toHaveTextContent('N123FA');
    expect(card).toHaveTextContent('John Doe');
    expect(card).toHaveTextContent('Need fuel and O2 topoff');
  });

  it('should trigger onCardSelect when a card is clicked', async () => {
    const user = userEvent.setup();
    const onCardSelect = vi.fn();

    renderWithProviders(<KanbanBoard items={mockServiceRequests} onCardSelect={onCardSelect} />);

    const card = screen.getByTestId('kanban-card-request-1');
    await user.click(card);

    expect(onCardSelect).toHaveBeenCalledWith('request-1');
  });
});

