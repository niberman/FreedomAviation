import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyCredits,
  getTierName,
  getTierMultiplier,
  calculateServiceCredits,
} from './creditCalculator';

describe('Credit Calculator', () => {
  describe('calculateMonthlyCredits', () => {
    it('should calculate credits for low activity (< 10 hours)', () => {
      const result = calculateMonthlyCredits(5, 100, 200);
      expect(result.baseCredits).toBe(100);
      // Uses getTierMultiplier(5) which is 1.0, not 0.5
      // Actually, looking at getTierMultiplier: hoursFlown < 5 returns 0.5
      // So 5 hours should use multiplier 1.0 (since 5 >= 5)
      expect(result.totalCredits).toBe(100); // 100 * 1.0 (tier multiplier for 5 hours)
      expect(result.tierName).toBe('Regular Flyer');
    });

    it('should calculate credits for high activity (>= 10 hours)', () => {
      const result = calculateMonthlyCredits(15, 100, 200);
      expect(result.baseCredits).toBe(200);
      // calculateMonthlyCredits uses default tierMultiplier of 1.0 when not provided
      // The tierName comes from getTierName, but multiplier is separate
      expect(result.totalCredits).toBe(200); // 200 * 1.0 (default multiplier)
      expect(result.tierName).toBe('Frequent Flyer');
    });

    it('should apply custom tier multiplier', () => {
      const result = calculateMonthlyCredits(5, 100, 200, 2.0);
      expect(result.baseCredits).toBe(100);
      expect(result.totalCredits).toBe(200); // 100 * 2.0
      expect(result.multiplier).toBe(2.0);
    });

    it('should handle edge case at threshold (exactly 10 hours)', () => {
      const result = calculateMonthlyCredits(10, 100, 200);
      expect(result.baseCredits).toBe(200); // >= 10 uses high
      expect(result.totalCredits).toBe(200);
    });
  });

  describe('getTierName', () => {
    it('should return correct tier names', () => {
      expect(getTierName(3)).toBe('Light Flyer');
      expect(getTierName(10)).toBe('Regular Flyer');
      expect(getTierName(20)).toBe('Frequent Flyer');
      expect(getTierName(35)).toBe('Professional');
    });

    it('should handle edge cases', () => {
      expect(getTierName(0)).toBe('Light Flyer');
      expect(getTierName(4.9)).toBe('Light Flyer');
      expect(getTierName(5)).toBe('Regular Flyer');
      expect(getTierName(14.9)).toBe('Regular Flyer');
      expect(getTierName(15)).toBe('Frequent Flyer');
      expect(getTierName(29.9)).toBe('Frequent Flyer');
      expect(getTierName(30)).toBe('Professional');
    });
  });

  describe('getTierMultiplier', () => {
    it('should return correct multipliers', () => {
      expect(getTierMultiplier(3)).toBe(0.5);
      expect(getTierMultiplier(10)).toBe(1.0);
      expect(getTierMultiplier(20)).toBe(1.5);
      expect(getTierMultiplier(35)).toBe(2.0);
    });

    it('should handle edge cases', () => {
      expect(getTierMultiplier(0)).toBe(0.5);
      expect(getTierMultiplier(4.9)).toBe(0.5);
      expect(getTierMultiplier(5)).toBe(1.0);
      expect(getTierMultiplier(14.9)).toBe(1.0);
      expect(getTierMultiplier(15)).toBe(1.5);
      expect(getTierMultiplier(29.9)).toBe(1.5);
      expect(getTierMultiplier(30)).toBe(2.0);
    });
  });

  describe('calculateServiceCredits', () => {
    const mockServices = [
      {
        id: 'service1',
        name: 'Detailing',
        base_credits_low_activity: 50,
        base_credits_high_activity: 100,
        can_rollover: true,
      },
      {
        id: 'service2',
        name: 'Maintenance',
        base_credits_low_activity: 75,
        base_credits_high_activity: 150,
        can_rollover: false,
      },
    ];

    it('should calculate credits for multiple services', () => {
      const result = calculateServiceCredits(15, mockServices);
      
      expect(result.size).toBe(2);
      expect(result.get('service1')).toBeDefined();
      expect(result.get('service2')).toBeDefined();
      
      const service1Credits = result.get('service1')!;
      expect(service1Credits.baseCredits).toBe(100); // >= 10 hours
      expect(service1Credits.totalCredits).toBe(150); // 100 * 1.5 (tier multiplier for 15 hours)
      
      const service2Credits = result.get('service2')!;
      expect(service2Credits.baseCredits).toBe(150); // >= 10 hours
      expect(service2Credits.totalCredits).toBe(225); // 150 * 1.5 (tier multiplier for 15 hours)
    });

    it('should use custom tier multiplier when provided', () => {
      const result = calculateServiceCredits(5, mockServices, 2.0);
      
      const service1Credits = result.get('service1')!;
      expect(service1Credits.baseCredits).toBe(50); // < 10 hours
      expect(service1Credits.totalCredits).toBe(100); // 50 * 2.0
    });

    it('should handle services with missing credit values', () => {
      const servicesWithMissing = [
        {
          id: 'service3',
          name: 'Service',
          base_credits_low_activity: undefined as any,
          base_credits_high_activity: undefined as any,
          can_rollover: false,
        },
      ];
      
      const result = calculateServiceCredits(15, servicesWithMissing);
      const credits = result.get('service3')!;
      expect(credits.baseCredits).toBe(0);
      expect(credits.totalCredits).toBe(0);
    });
  });
});

