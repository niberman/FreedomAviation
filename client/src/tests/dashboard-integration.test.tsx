// @vitest-environment jsdom
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StaffDashboard from '../pages/staff-dashboard';
import OwnerDashboard from '../pages/owner-dashboard';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Mock dependencies
vi.mock('@/lib/supabase', () => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        insert: vi.fn(() => mockSupabase),
        update: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        order: vi.fn(() => mockSupabase),
        limit: vi.fn(() => mockSupabase),
        in: vi.fn(() => mockSupabase),
        maybeSingle: vi.fn(),
        auth: {
            getUser: vi.fn(),
        },
    };
    return {
        supabase: mockSupabase,
    };
});

vi.mock('@/lib/auth-utils', () => ({
    authenticatedFetch: vi.fn(),
}));

vi.mock('@/lib/auth-context');
vi.mock('@/hooks/use-toast');
vi.mock('wouter', async () => {
    const actual = await vi.importActual('wouter');
    return {
        ...actual,
        useLocation: vi.fn(),
        useSearch: vi.fn(() => ''),
        Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
            <a href={href}>{children}</a>
        ),
    };
});

// Mock child components
vi.mock('@/components/dashboard/layout', () => ({
    DashboardLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dashboard-layout">{children}</div>
    ),
}));

vi.mock('@/features/owner/components/QuickActions', () => ({
    QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

vi.mock('@/components/kanban-board', () => ({
    KanbanBoard: ({ items, onStatusChange }: any) => (
        <div data-testid="kanban-board">
            {items.map((item: any) => (
                <div key={item.id} data-testid={`kanban-item-${item.id}`}>
                    {item.status}
                    <button
                        data-testid={`move-to-progress-${item.id}`}
                        onClick={() => onStatusChange(item.id, 'in_progress')}
                    >
                        Start
                    </button>
                </div>
            ))}
        </div>
    ),
}));

const mockToast = vi.fn();
const mockSetLocation = vi.fn();

describe('Dashboard Integration Workflows', () => {
    let queryClient: QueryClient;
    let mockSupabase: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        (useToast as any).mockReturnValue({ toast: mockToast });
        (useLocation as any).mockReturnValue(['/dashboard', mockSetLocation]);

        const supabaseModule = await import('@/lib/supabase');
        mockSupabase = supabaseModule.supabase;

        // Default mocks
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.select.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
        mockSupabase.order.mockReturnValue(mockSupabase);
        mockSupabase.limit.mockReturnValue(mockSupabase);
        mockSupabase.in.mockReturnValue(mockSupabase);

        // Mock fetch for API calls
        // global.fetch = vi.fn();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        );
    };

    it('should reflect service request status changes from Staff to Owner', async () => {
        // 1. Setup shared data
        const aircraftId = 'aircraft-1';
        const ownerId = 'owner-1';
        const requestId = 'req-1';

        const mockAircraft = {
            id: aircraftId,
            tail_number: 'N123FA',
            owner_id: ownerId,
            base_location: 'KAPA',
            make: 'Cirrus',
            model: 'SR22',
            year: 2023,
            hobbs_hours: 100,
            tach_hours: 90
        };

        const mockServiceRequest = {
            id: requestId,
            aircraft_id: aircraftId,
            user_id: ownerId,
            service_type: 'Pre-Flight Concierge',
            status: 'pending',
            requested_departure: new Date().toISOString(),
            aircraft: { tail_number: 'N123FA' },
            owner: { full_name: 'Owner Name' }
        };

        // 2. Render Staff Dashboard and simulate status change
        (useAuth as any).mockReturnValue({ user: { id: 'staff-1', role: 'staff' } });

        // Mock API response for staff dashboard
        const { authenticatedFetch } = await import('@/lib/auth-utils');
        (authenticatedFetch as any).mockImplementation((url: string) => {
            if (url === '/api/service-requests') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ serviceRequests: [mockServiceRequest] })
                });
            }
            if (url.includes(`/api/service-requests/${requestId}`)) {
                // Update the mock object status
                mockServiceRequest.status = 'in_progress';
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        // Mock Supabase calls for Staff Dashboard (clients, aircraft, etc.)
        mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
            data: { session: { access_token: 'mock-token', expires_at: Date.now() / 1000 + 3600 } },
            error: null
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_profiles') return { ...mockSupabase, select: () => ({ ...mockSupabase, eq: () => ({ ...mockSupabase, maybeSingle: () => ({ data: { role: 'staff' } }) }) }) };
            if (table === 'notifications') return { ...mockSupabase, select: () => ({ ...mockSupabase, eq: () => ({ ...mockSupabase, order: () => ({ data: [], error: null }) }) }) };
            return mockSupabase;
        });

        const { unmount: unmountStaff } = renderWithProviders(<StaffDashboard />);

        await waitFor(() => {
            expect(screen.getByTestId(`kanban-item-${requestId}`)).toBeInTheDocument();
        });

        // Simulate moving card to "In Progress"
        const moveButton = screen.getByTestId(`move-to-progress-${requestId}`);
        fireEvent.click(moveButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Status updated'
            }));
        });

        unmountStaff();

        // 3. Render Owner Dashboard and verify status
        (useAuth as any).mockReturnValue({ user: { id: ownerId, role: 'owner' } });

        // Mock Supabase calls for Owner Dashboard
        const aircraftChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [mockAircraft], error: null }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        const requestsChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            order: vi.fn().mockImplementation(() => {
                console.log('Fetching service requests for owner');
                return Promise.resolve({
                    data: [{ ...mockServiceRequest, status: 'in_progress' }],
                    error: null
                });
            }),
            limit: vi.fn().mockReturnThis(),
        };

        const tasksChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        const notificationsChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        const membershipChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'aircraft') return aircraftChain;
            if (table === 'service_requests') return requestsChain;
            if (table === 'service_tasks') return tasksChain;
            if (table === 'notifications') return notificationsChain;
            if (table === 'memberships') return membershipChain;
            if (table === 'user_profiles') return { ...mockSupabase, select: () => ({ ...mockSupabase, eq: () => ({ ...mockSupabase, maybeSingle: () => ({ data: { role: 'owner' } }) }) }) };
            return mockSupabase;
        });

        renderWithProviders(<OwnerDashboard />);

        await waitFor(() => {
            // Owner dashboard shows "Line Ops" for in_progress status
            expect(requestsChain.order).toHaveBeenCalled();
            expect(screen.getAllByText(/Line Ops/i).length).toBeGreaterThan(0);
        });
    });
});
