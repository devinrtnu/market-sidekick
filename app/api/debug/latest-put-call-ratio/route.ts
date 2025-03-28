import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { determinePutCallStatus } from '@/lib/utils/indicator-utils';

/**
 * Debug API endpoint to get the latest put-call ratio data directly from the database
 * This bypasses all caching and always fetches fresh data
 */
export async function GET() {
  try {
    console.log('[DEBUG API] Fetching latest put-call ratio data directly from database...');
    
    // Get latest data from database (use the correct daily_put_call_ratios table)
    const { data: latestData, error: latestError } = await supabaseAdmin
      .from('daily_put_call_ratios')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (latestError) {
      console.error('[DEBUG API] Error fetching latest data:', latestError);
      return NextResponse.json({ error: 'Failed to fetch latest data' }, { status: 500 });
    }
    
    // Get all data for debugging (use the correct daily_put_call_ratios table)
    const { data: allData, error: allError } = await supabaseAdmin
      .from('daily_put_call_ratios')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);
    
    console.log(`[DEBUG API] Latest put-call ratio from database: ${latestData.ratio_value} (${latestData.date})`);
    
    return NextResponse.json({
      latestEntry: latestData,
      recentEntries: allData || [],
      message: 'This is a direct database query bypassing all caching',
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[DEBUG API] Error fetching debug data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 