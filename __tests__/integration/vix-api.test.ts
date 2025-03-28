/**
 * Integration tests for VIX API endpoints
 * 
 * These tests validate the full API endpoints rather than just the underlying Yahoo Finance integration
 */

// Create a fetch wrapper that uses a node-friendly fetch implementation
import { createServer } from 'http';
import { apiResolver } from 'next/dist/server/api-utils/node';
import { NextApiRequest, NextApiResponse } from 'next';
import { GET as vixHandler } from '../../app/api/indicators/vix/route';
import { GET as historyHandler } from '../../app/api/indicators/vix/history/route';

// Helper function to simulate a Next.js API route handler in tests
async function testApiRoute(
  handler: any,
  { query = {}, method = 'GET' }: { query?: Record<string, string>, method?: string } = {}
) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        // Convert headers to lowercase for compatibility
        const headers = {};
        for (const [key, value] of Object.entries(req.headers)) {
          headers[key.toLowerCase()] = value;
        }
        
        // Create Next.js compatible request and response objects
        const nextReq = {
          url: req.url,
          method,
          headers,
          query,
          body: null,
          cookies: {},
        } as unknown as NextApiRequest;
        
        const nextRes = res as unknown as NextApiResponse;
        
        // Call the API handler
        await apiResolver(
          req,
          res,
          query,
          (req, res) => handler(req, res),
          { previewModeId: '', previewModeEncryptionKey: '', previewModeSigningKey: '' },
          false
        );
      } catch (e) {
        reject(e);
      }
    });

    // Start listening on a random port
    server.listen(0, () => {
      const { port } = server.address() as { port: number };
      const url = `http://localhost:${port}`;
      
      // Make the request
      fetch(url)
        .then(response => {
          return response.json().then(data => {
            server.close();
            resolve({ status: response.status, data });
          });
        })
        .catch(err => {
          server.close();
          reject(err);
        });
    });
  });
}

describe('VIX API Endpoints', () => {
  jest.setTimeout(30000); // 30 seconds timeout for API calls
  
  // Mock process.env.NODE_ENV to ensure we get mock data in tests
  const originalNodeEnv = process.env.NODE_ENV;
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  describe('GET /api/indicators/vix', () => {
    it('should return valid VIX data', async () => {
      const response = await testApiRoute(vixHandler);
      
      const { status, data } = response as any;
      
      // Verify response status
      expect(status).toBe(200);
      
      // Verify data structure
      expect(data).toHaveProperty('currentVix');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('termStructure');
      
      // Check if we got real or fallback data
      if (data.status !== 'error') {
        // If we got real data, validate value ranges
        if (data.currentVix !== null) {
          expect(typeof data.currentVix).toBe('number');
          expect(data.currentVix).toBeGreaterThan(5);
          expect(data.currentVix).toBeLessThan(100);
        }
        
        // Check term structure for at least some data
        const termStructure = data.termStructure;
        expect(termStructure).toBeDefined();
        
        // At least one term should be defined in development environment
        const hasTermData = termStructure.oneMonth !== null || 
                           termStructure.threeMonth !== null || 
                           termStructure.sixMonth !== null;
        expect(hasTermData).toBe(true);
      }
      
      // Log what we got for manual verification
      console.log('VIX API Response:', {
        currentVix: data.currentVix,
        status: data.status,
        hasTermStructure: !!data.termStructure
      });
    });
  });
  
  describe('GET /api/indicators/vix/history', () => {
    it('should return valid historical VIX data', async () => {
      // Test with 1-month range
      const response = await testApiRoute(historyHandler, { 
        query: { range: '1mo', interval: '1d' } 
      });
      
      const { status, data } = response as any;
      
      // Verify response status
      expect(status).toBe(200);
      
      // Verify we have historical data points
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Check data point structure
      const firstPoint = data.data[0];
      expect(firstPoint).toHaveProperty('date');
      expect(firstPoint).toHaveProperty('value');
      expect(typeof firstPoint.date).toBe('number');
      expect(typeof firstPoint.value).toBe('number');
      
      // Log what we got for manual verification
      console.log('Historical VIX Data:', {
        points: data.data.length,
        firstDate: new Date(data.data[0].date).toLocaleDateString(),
        lastDate: new Date(data.data[data.data.length - 1].date).toLocaleDateString()
      });
    });
    
    it('should validate range parameter', async () => {
      // Test with invalid range
      const response = await testApiRoute(historyHandler, { 
        query: { range: 'invalid', interval: '1d' } 
      });
      
      const { status, data } = response as any;
      
      // Should return 400 Bad Request
      expect(status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid range parameter');
    });
  });
}); 