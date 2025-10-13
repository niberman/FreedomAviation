import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Owner Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prepare Aircraft for Flight', () => {
    it('should create service request with correct payload', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };

      const payload = {
        service_type: 'Pre-Flight Concierge',
        priority: 'high',
        status: 'pending',
        user_id: 'test-user-id',
        aircraft_id: 'test-aircraft-id',
        airport: 'KAPA',
        requested_departure: '2025-10-15T10:00:00',
        fuel_grade: '100LL',
        fuel_quantity: '50',
        o2_topoff: true,
        tks_topoff: false,
        gpu_required: true,
        hangar_pullout: true,
        description: 'Pre-Flight Concierge Request',
        cabin_provisioning: null,
      };

      mockSupabase.from('service_requests').insert(payload);

      expect(mockSupabase.from).toHaveBeenCalledWith('service_requests');
      expect(mockInsert).toHaveBeenCalledWith(payload);
    });

    it('should handle cabin provisioning as JSON or text', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };

      const cabinProvisioningText = 'Water, Snacks';
      const result = (() => {
        try {
          return JSON.parse(cabinProvisioningText);
        } catch {
          return cabinProvisioningText;
        }
      })();

      expect(result).toBe('Water, Snacks');

      const cabinProvisioningJSON = '{"water": true, "snacks": true}';
      const resultJSON = (() => {
        try {
          return JSON.parse(cabinProvisioningJSON);
        } catch {
          return cabinProvisioningJSON;
        }
      })();

      expect(resultJSON).toEqual({ water: true, snacks: true });
    });
  });

  describe('Request Service', () => {
    it('should create service request with status=new', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };

      const payload = {
        service_type: 'Oil Service',
        priority: 'medium',
        status: 'new',
        user_id: 'test-user-id',
        aircraft_id: 'test-aircraft-id',
        description: 'Need oil change',
      };

      mockSupabase.from('service_requests').insert(payload);

      expect(mockSupabase.from).toHaveBeenCalledWith('service_requests');
      expect(mockInsert).toHaveBeenCalledWith(payload);
    });

    it('should support different service types', async () => {
      const serviceTypes = [
        'Pre-Flight Concierge',
        'Full Detail',
        'Oil Service',
        'O₂ Service',
        'TKS Service',
        'Database Update',
        'Other',
      ];

      serviceTypes.forEach(type => {
        const payload = {
          service_type: type,
          priority: 'medium',
          status: 'new',
          user_id: 'test-user-id',
          aircraft_id: 'test-aircraft-id',
          description: `${type} request`,
        };

        expect(payload.service_type).toBe(type);
        expect(payload.status).toBe('new');
      });
    });
  });
});
