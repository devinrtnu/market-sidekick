import { determinePutCallStatus, formatWithSign, getPutCallRatioDescription } from '@/lib/utils/indicator-utils';
import { PutCallRatioData } from '@/lib/types/indicators';

describe('Indicator Utilities', () => {
  describe('determinePutCallStatus', () => {
    it('should return "normal" for values below 0.7', () => {
      expect(determinePutCallStatus(0.65)).toBe('normal');
      expect(determinePutCallStatus(0.5)).toBe('normal');
      expect(determinePutCallStatus(0.0)).toBe('normal');
    });
    
    it('should return "warning" for values between 0.7 and 1.0', () => {
      expect(determinePutCallStatus(0.7)).toBe('warning');
      expect(determinePutCallStatus(0.85)).toBe('warning');
      expect(determinePutCallStatus(0.99)).toBe('warning');
    });
    
    it('should return "danger" for values 1.0 and above', () => {
      expect(determinePutCallStatus(1.0)).toBe('danger');
      expect(determinePutCallStatus(1.25)).toBe('danger');
      expect(determinePutCallStatus(2.0)).toBe('danger');
    });
  });
  
  describe('formatWithSign', () => {
    it('should add plus sign to positive numbers', () => {
      expect(formatWithSign(5)).toBe('+5.00');
      expect(formatWithSign(0.1)).toBe('+0.10');
    });
    
    it('should keep minus sign on negative numbers', () => {
      expect(formatWithSign(-5)).toBe('-5.00');
      expect(formatWithSign(-0.1)).toBe('-0.10');
    });
    
    it('should handle zero with plus sign', () => {
      expect(formatWithSign(0)).toBe('+0.00');
    });
  });
  
  describe('getPutCallRatioDescription', () => {
    it('should return a message when data is unavailable', () => {
      const data: PutCallRatioData = {
        totalPutCallRatio: null,
        equityPutCallRatio: null,
        indexPutCallRatio: null,
        twentyDayAverage: null,
        status: 'error',
        value: null,
        timestamp: Date.now(),
      };
      
      const description = getPutCallRatioDescription(data);
      expect(description).toEqual(['Put/call ratio data is currently unavailable.']);
    });
    
    it('should describe the current value', () => {
      const data: PutCallRatioData = {
        totalPutCallRatio: 0.85,
        equityPutCallRatio: null,
        indexPutCallRatio: null,
        twentyDayAverage: null,
        status: 'warning',
        value: 0.85,
        timestamp: Date.now(),
      };
      
      const description = getPutCallRatioDescription(data);
      expect(description[0]).toContain('0.85');
    });
    
    it('should include 20-day average comparison when available', () => {
      const data: PutCallRatioData = {
        totalPutCallRatio: 0.9,
        equityPutCallRatio: null,
        indexPutCallRatio: null,
        twentyDayAverage: 0.8,
        status: 'warning',
        value: 0.9,
        timestamp: Date.now(),
      };
      
      const description = getPutCallRatioDescription(data);
      expect(description[1]).toContain('up');
      expect(description[1]).toContain('0.80');
    });
    
    it('should describe high ratio significance', () => {
      const data: PutCallRatioData = {
        totalPutCallRatio: 1.3,
        equityPutCallRatio: null,
        indexPutCallRatio: null,
        twentyDayAverage: null,
        status: 'danger',
        value: 1.3,
        timestamp: Date.now(),
      };
      
      const description = getPutCallRatioDescription(data);
      expect(description).toEqual([
        'The current put/call ratio is 1.30.',
        'High put/call ratios indicate bearish sentiment, often a contrarian bullish signal.'
      ]);
    });
    
    it('should describe low ratio significance', () => {
      const data: PutCallRatioData = {
        totalPutCallRatio: 0.6,
        equityPutCallRatio: null,
        indexPutCallRatio: null,
        twentyDayAverage: null,
        status: 'normal',
        value: 0.6,
        timestamp: Date.now(),
      };
      
      const description = getPutCallRatioDescription(data);
      expect(description).toEqual([
        'The current put/call ratio is 0.60.',
        'Low put/call ratios show bullish sentiment, potentially a contrarian bearish signal.'
      ]);
    });
    
    it('should describe neutral ratio significance', () => {
      const data: PutCallRatioData = {
        totalPutCallRatio: 0.95,
        equityPutCallRatio: null,
        indexPutCallRatio: null,
        twentyDayAverage: null,
        status: 'warning',
        value: 0.95,
        timestamp: Date.now(),
      };
      
      const description = getPutCallRatioDescription(data);
      expect(description).toEqual([
        'The current put/call ratio is 0.95.',
        'This level indicates balanced market sentiment.'
      ]);
    });
  });
}); 