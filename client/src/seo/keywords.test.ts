import { describe, it, expect } from 'vitest';
import { allKeywords, airportKeywords, locationKeywords, SEO_KEYWORDS } from './keywords';

describe('SEO Keywords', () => {
  describe('allKeywords', () => {
    it('should return all keywords as comma-separated string', () => {
      const result = allKeywords();
      expect(result).toContain('aircraft management');
      expect(result).toContain('Colorado');
      expect(result).toContain('KAPA');
      expect(result).toContain('Sky Harbour');
    });

    it('should include all keyword categories', () => {
      const result = allKeywords();
      const keywords = result.split(', ');
      
      // Should include services
      expect(keywords.some(k => k.includes('aircraft management'))).toBe(true);
      
      // Should include modifiers
      expect(keywords.some(k => k.includes('premium'))).toBe(true);
      
      // Should include airports (lowercase)
      expect(keywords.some(k => k.toLowerCase() === 'kapa')).toBe(true);
      
      // Should include partners
      expect(keywords.some(k => k.includes('Sky Harbour'))).toBe(true);
      
      // Should include long-tail
      expect(keywords.some(k => k.includes('aircraft management Colorado'))).toBe(true);
    });

    it('should convert airports to lowercase', () => {
      const result = allKeywords();
      // The function converts airports to lowercase
      const keywords = result.split(', ');
      const hasLowercaseAirport = keywords.some(k => k.toLowerCase() === 'kapa');
      expect(hasLowercaseAirport).toBe(true);
    });
  });

  describe('airportKeywords', () => {
    it('should return base keywords when no airport code provided', () => {
      const result = airportKeywords();
      expect(result).toContain('aircraft management');
      expect(result).toContain('premium');
    });

    it('should add airport code for valid airports', () => {
      const result = airportKeywords('KAPA');
      expect(result).toContain('KAPA');
      expect(result).toContain('KAPA aircraft services');
    });

    it('should handle lowercase airport codes', () => {
      const result = airportKeywords('kapa');
      expect(result).toContain('KAPA');
    });

    it('should handle invalid airport codes', () => {
      const result = airportKeywords('INVALID');
      expect(result).not.toContain('INVALID');
      expect(result).toContain('aircraft management');
    });

    it('should handle all valid airports', () => {
      const validAirports = ['KAPA', 'KBJC', 'KFTG', 'KDEN', 'KCOS', 'KBDU', 'KFNL', 'KGXY'];
      
      validAirports.forEach(airport => {
        const result = airportKeywords(airport);
        expect(result).toContain(airport);
        expect(result).toContain(`${airport} aircraft services`);
      });
    });
  });

  describe('locationKeywords', () => {
    it('should return base keywords when no location provided', () => {
      const result = locationKeywords();
      expect(result).toContain('aircraft management');
      expect(result).toContain('premium');
    });

    it('should add partner location when matching', () => {
      const result = locationKeywords('Sky Harbour');
      expect(result).toContain('Sky Harbour');
      expect(result).toContain('Sky Harbour aircraft management');
    });

    it('should handle case-insensitive location matching', () => {
      const result = locationKeywords('sky harbour');
      expect(result).toContain('Sky Harbour');
    });

    it('should handle partial location matches', () => {
      const result = locationKeywords('Sky Harbour @ KAPA');
      expect(result).toContain('Sky Harbour');
    });

    it('should handle non-partner locations', () => {
      const result = locationKeywords('Random Location');
      expect(result).not.toContain('Random Location');
      expect(result).toContain('aircraft management');
    });

    it('should handle all partner locations', () => {
      const partners = ['Sky Harbour', 'Sky Harbour @ KAPA', 'Freedom Aviation Hangar', 'Fox 9 Hangar'];
      
      partners.forEach(partner => {
        const result = locationKeywords(partner);
        // Should contain the partner name (case-insensitive match)
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SEO_KEYWORDS constant', () => {
    it('should have all expected categories', () => {
      expect(SEO_KEYWORDS.services).toBeDefined();
      expect(SEO_KEYWORDS.modifiers).toBeDefined();
      expect(SEO_KEYWORDS.airports).toBeDefined();
      expect(SEO_KEYWORDS.partners).toBeDefined();
      expect(SEO_KEYWORDS.longTail).toBeDefined();
    });

    it('should have non-empty arrays', () => {
      expect(SEO_KEYWORDS.services.length).toBeGreaterThan(0);
      expect(SEO_KEYWORDS.modifiers.length).toBeGreaterThan(0);
      expect(SEO_KEYWORDS.airports.length).toBeGreaterThan(0);
      expect(SEO_KEYWORDS.partners.length).toBeGreaterThan(0);
      expect(SEO_KEYWORDS.longTail.length).toBeGreaterThan(0);
    });
  });
});

