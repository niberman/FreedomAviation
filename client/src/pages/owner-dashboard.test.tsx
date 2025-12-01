// @vitest-environment jsdom
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OwnerDashboard from './owner-dashboard';
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
        maybeSingle: vi.fn(),
        auth: {
            getUser: vi.fn(),
        },
    };
    return {
        supabase: mockSupabase,
    };
});

vi.mock('@/lib/auth-context');
vi.mock('@/hooks/use-toast');
vi.mock('wouter', async () => {
    const actual = await vi.importActual('wouter');
    return {
        ...actual,
        useLocation: vi.fn(),
        Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
            <a href={href}>{children}</a>
        ),
    };
});

// Mock child components to simplify testing
vi.mock('@/components/dashboard/layout', () => ({
    DashboardLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dashboard-layout">{children}</div>
    ),
}));

vi.mock('@/features/owner/components/QuickActions', () => ({
    QuickActions: ({ aircraftId, onAction }: any) => (
        <div data-testid="quick-actions">
            <button
                data-testid="quick-action-btn"
                onClick={() => onAction && onAction('service')}
            >
                Request Service
            </button>
        </div>
    ),
}));

const mockToast = vi.fn();
const mockSetLocation = vi.fn();
const mockUser = { id: 'owner-123', email: 'owner@test.com' };

describe('OwnerDashboard', () => {
    let queryClient: QueryClient;
    let mockSupabase: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        (useAuth as any).mockReturnValue({ user: mockUser });
        (useToast as any).mockReturnValue({ toast: mockToast });
        (useLocation as any).mockReturnValue(['/dashboard', mockSetLocation]);

        const supabaseModule = await import('@/lib/supabase');
        mockSupabase = supabaseModule.supabase;

        // Default mock implementations
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.select.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
        mockSupabase.order.mockReturnValue(mockSupabase);
        mockSupabase.limit.mockReturnValue(mockSupabase);
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        );
    };

    it('should redirect staff users to staff dashboard', async () => {
        // Mock user profile as staff
        mockSupabase.maybeSingle.mockResolvedValue({
            data: { role: 'staff' },
            error: null,
        });

        renderWithProviders(<OwnerDashboard />);

        await waitFor(() => {
            expect(mockSetLocation).toHaveBeenCalledWith('/staff');
        });
    });

    it('should display aircraft information when loaded', async () => {
        // Mock user profile as owner
        mockSupabase.maybeSingle.mockResolvedValue({
            data: { role: 'owner' },
            error: null,
        });

        // Mock aircraft data
        const mockAircraft = [{
            id: 'aircraft-1',
            tail_number: 'N123FA',
            make: 'Cirrus',
            model: 'SR22',
            year: 2023,
            base_location: 'KAPA',
            hobbs_hours: 150.5,
            tach_hours: 140.0,
            owner_id: mockUser.id
        }];

        // Create distinct mock chains for different tables
        const aircraftChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockAircraft, error: null }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        const requestsChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            limit: vi.fn().mockReturnThis(),
        };

        const tasksChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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
            if (table === 'memberships') return membershipChain;
            return mockSupabase;
        });

        renderWithProviders(<OwnerDashboard />);

        await waitFor(() => {
            expect(screen.getByText('N123FA')).toBeInTheDocument();
            expect(screen.getByText(/Cirrus SR22/)).toBeInTheDocument();
            expect(screen.getByText('KAPA')).toBeInTheDocument();
        });
    });

    it('should show "No aircraft assigned" when user has no aircraft', async () => {
        mockSupabase.maybeSingle.mockResolvedValue({
            data: { role: 'owner' },
            error: null,
        });

        const aircraftChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'aircraft') return aircraftChain;
            return mockSupabase;
        });

        renderWithProviders(<OwnerDashboard />);

        await waitFor(() => {
            expect(screen.getByText('No aircraft assigned')).toBeInTheDocument();
        });
    });
});
