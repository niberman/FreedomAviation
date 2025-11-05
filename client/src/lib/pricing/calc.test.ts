import { describe, it, expect } from 'vitest';
import { calcRow, formatMoney, formatPercent } from './calc';
import type { Assumptions, ClassCfg, RowInput } from './types';

describe('Pricing Calculator', () => {
  const mockAssumptions: Assumptions = {
    labor_rate: 100,
    card_fee_pct: 2.5,
    cfi_allocation: 50,
    cleaning_supplies: 25,
    overhead_per_ac: 200,
    avionics_db_per_ac: 30,
  };

  const mockClassCfg: ClassCfg = {
    id: 'class1',
    name: 'High Performance',
    default_price: 500,
    labor_hours: 2,
    avionics_db: 30,
    consumables: 15,
  };

  describe('calcRow', () => {
    it('should calculate all cost components correctly', () => {
      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: null,
        hangar_cost: null,
        location: null,
      };

      const result = calcRow(mockAssumptions, mockClassCfg, rowInput);

      expect(result.final_price).toBe(500); // default_price
      expect(result.labor_cost).toBe(200); // 2 hours * 100
      expect(result.cfi).toBe(50);
      expect(result.cleaning).toBe(25);
      expect(result.avionics_db).toBe(30);
      expect(result.consumables).toBe(15);
      expect(result.overhead).toBe(200);
      expect(result.cc_fee).toBe(13); // 500 * 0.025 = 12.5, Math.round = 13
      expect(result.hangar_derived).toBe(0); // no hangar cost
      expect(result.total_cost).toBe(533); // sum of all costs (200+50+25+30+15+200+13)
      expect(result.net_revenue).toBe(-33); // 500 - 533
      expect(result.margin_pct).toBeCloseTo(-0.066, 2); // -33 / 500 = -0.066
    });

    it('should use custom_price when provided', () => {
      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: 600,
        hangar_cost: null,
        location: null,
      };

      const result = calcRow(mockAssumptions, mockClassCfg, rowInput);
      expect(result.final_price).toBe(600);
      expect(result.cc_fee).toBe(15); // 600 * 0.025 = 15
    });

    it('should use hangar_cost override when provided', () => {
      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: null,
        hangar_cost: 150,
        location: null,
      };

      const result = calcRow(mockAssumptions, mockClassCfg, rowInput);
      expect(result.hangar_derived).toBe(150);
    });

    it('should use location default_hangar_cost when hangar_cost not provided', () => {
      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: null,
        hangar_cost: null,
        location: {
          id: 'loc1',
          name: 'Location 1',
          slug: 'location-1',
          default_hangar_cost: 120,
        },
      };

      const result = calcRow(mockAssumptions, mockClassCfg, rowInput);
      expect(result.hangar_derived).toBe(120);
    });

    it('should prioritize hangar_cost override over location default', () => {
      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: null,
        hangar_cost: 200,
        location: {
          id: 'loc1',
          name: 'Location 1',
          slug: 'location-1',
          default_hangar_cost: 120,
        },
      };

      const result = calcRow(mockAssumptions, mockClassCfg, rowInput);
      expect(result.hangar_derived).toBe(200);
    });

    it('should handle zero final_price', () => {
      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: 0,
        hangar_cost: null,
        location: null,
      };

      const result = calcRow(mockAssumptions, mockClassCfg, rowInput);
      expect(result.final_price).toBe(0);
      expect(result.margin_pct).toBe(0);
    });

    it('should use class avionics_db when available', () => {
      const classWithAvionics: ClassCfg = {
        ...mockClassCfg,
        avionics_db: 50,
      };

      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: null,
        hangar_cost: null,
        location: null,
      };

      const result = calcRow(mockAssumptions, classWithAvionics, rowInput);
      expect(result.avionics_db).toBe(50);
    });

    it('should use class avionics_db when provided, otherwise fallback to assumptions', () => {
      const classWithoutAvionics: ClassCfg = {
        ...mockClassCfg,
        avionics_db: 0, // Explicitly set to 0
      };

      const rowInput: RowInput = {
        tail: 'N123FA',
        class_name: 'High Performance',
        custom_price: null,
        hangar_cost: null,
        location: null,
      };

      const result = calcRow(mockAssumptions, classWithoutAvionics, rowInput);
      // The implementation uses cls.avionics_db || a.avionics_db_per_ac || 0
      // Since cls.avionics_db is 0 (falsy), it falls back to avionics_db_per_ac (30)
      expect(result.avionics_db).toBe(30); // Falls back to assumptions value
    });
  });

  describe('formatMoney', () => {
    it('should format numbers as USD currency', () => {
      expect(formatMoney(100)).toBe('$100');
      expect(formatMoney(1000)).toBe('$1,000');
      expect(formatMoney(1234.56)).toBe('$1,235'); // rounds to nearest integer
    });

    it('should handle zero', () => {
      expect(formatMoney(0)).toBe('$0');
    });

    it('should handle negative numbers', () => {
      expect(formatMoney(-100)).toBe('-$100');
    });

    it('should handle null/undefined as zero', () => {
      expect(formatMoney(null as any)).toBe('$0');
      expect(formatMoney(undefined as any)).toBe('$0');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages correctly', () => {
      expect(formatPercent(0.1)).toBe('10.0%');
      expect(formatPercent(0.25)).toBe('25.0%');
      expect(formatPercent(0.5)).toBe('50.0%');
      expect(formatPercent(1.0)).toBe('100.0%');
    });

    it('should handle decimal percentages', () => {
      expect(formatPercent(0.123)).toBe('12.3%');
      expect(formatPercent(0.1234)).toBe('12.3%'); // rounds to 1 decimal
    });

    it('should handle negative percentages', () => {
      expect(formatPercent(-0.1)).toBe('-10.0%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0.0%');
    });
  });
});

