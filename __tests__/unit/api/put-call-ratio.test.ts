import { NextRequest } from 'next/server';
import { GET, clearCache } from '@/app/api/indicators/put-call-ratio/route';
import { supabaseAdmin } from '@/lib/supabase';
import { extractPutCallRatio } from '@/lib/api/firecrawl';
import { fetchOptionsDataFromYahoo } from '@/lib/api/options-data';

// Mock modules
jest.mock('@/lib/api/firecrawl');
jest.mock('@/lib/api/options-data');
jest.mock('@/lib/supabase');

describe('PUT-CALL RATIO API', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear cache between tests
    clearCache();
    
    // Setup default mock implementations
    (extractPutCallRatio as jest.Mock).mockResolvedValue(0.85);
    (fetchOptionsDataFromYahoo as jest.Mock).mockResolvedValue(0.9);
    
    // Mock supabase responses
    (supabaseAdmin.from as jest.Mock) = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    });
  });

  it('should return cached data if available', async () => {
    // Call the API once to setup cache
    const response1 = await GET();
    const data1 = await response1.json();
    
    // Call again to use cache
    const response2 = await GET();
    const data2 = await response2.json();
    
    // Verify extractPutCallRatio was only called once
    expect(extractPutCallRatio).toHaveBeenCalledTimes(1);
    
    // Verify both responses have the same data
    expect(data1).toEqual(data2);
  });
  
  it('should fetch data from Firecrawl when no cache is available', async () => {
    // Set up mock for this specific test
    (extractPutCallRatio as jest.Mock).mockResolvedValueOnce(0.75);
    
    const response = await GET();
    const data = await response.json();
    
    // Verify extractPutCallRatio was called
    expect(extractPutCallRatio).toHaveBeenCalledTimes(1);
    expect(extractPutCallRatio).toHaveBeenCalledWith("fc-200cbf4607c74ea5b7e038609edb0dc7");
    
    // Verify response structure
    expect(data).toHaveProperty('totalPutCallRatio', 0.75);
    expect(data).toHaveProperty('status', 'warning');
    expect(data).toHaveProperty('value', 0.75);
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('source', 'CBOE via Firecrawl');
    expect(data).toHaveProperty('isApproximateData', false);
  });
  
  it('should fall back to Yahoo Finance if Firecrawl fails', async () => {
    // Set up mocks for this specific test
    (extractPutCallRatio as jest.Mock).mockRejectedValueOnce(new Error('Firecrawl error'));
    
    const response = await GET();
    const data = await response.json();
    
    // Verify Yahoo Finance fallback was called
    expect(extractPutCallRatio).toHaveBeenCalledTimes(1);
    expect(fetchOptionsDataFromYahoo).toHaveBeenCalledTimes(1);
    
    // Verify response structure
    expect(data).toHaveProperty('totalPutCallRatio', 0.9);
    expect(data).toHaveProperty('status', 'warning');
    expect(data).toHaveProperty('source', 'Yahoo Finance (approximate)');
    expect(data).toHaveProperty('isApproximateData', true);
  });
  
  it('should return error response if all data sources fail', async () => {
    // Set up mocks for this specific test to reject both data sources
    (extractPutCallRatio as jest.Mock).mockRejectedValueOnce(new Error('Firecrawl error'));
    (fetchOptionsDataFromYahoo as jest.Mock).mockRejectedValueOnce(new Error('Yahoo error'));
    
    const response = await GET();
    
    // Verify both data sources were called and failed
    expect(extractPutCallRatio).toHaveBeenCalledTimes(1);
    expect(fetchOptionsDataFromYahoo).toHaveBeenCalledTimes(1);
    
    // Verify error response structure
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toHaveProperty('totalPutCallRatio', null);
    expect(data).toHaveProperty('status', 'error');
    expect(data).toHaveProperty('error', 'Failed to fetch data from CBOE website');
  });
  
  it('should use today\'s data from database if available', async () => {
    // Mock database having today's data
    const today = new Date().toISOString().split('T')[0];
    const mockData = {
      date: today,
      ratio_value: 1.25,
      status: 'danger',
      updated_at: new Date().toISOString(),
    };
    
    // Setup supabase to return data for this test
    (supabaseAdmin.from as jest.Mock) = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockData,
        error: null
      })
    });
    
    const response = await GET();
    const data = await response.json();
    
    // Verify extractPutCallRatio was NOT called (used DB data instead)
    expect(extractPutCallRatio).not.toHaveBeenCalled();
    
    // Verify response has the database values
    expect(data).toHaveProperty('totalPutCallRatio', 1.25);
    expect(data).toHaveProperty('status', 'danger');
  });
}); 