import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG API] Checking yield curve database tables...');
    
    let tablesExist = false;
    let tablesFound: string[] = [];
    let dailyCount = 0;
    let sparklineCount = 0;
    let latestDaily = null;
    let recentSparklines: any[] = [];
    
    // First try the information_schema approach
    try {
      const { data: tablesData, error: tablesError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['daily_yield_curves', 'yield_curve_sparklines']);
      
      if (!tablesError && tablesData) {
        tablesExist = tablesData.length === 2;
        tablesFound = tablesData.map(t => t.table_name);
        console.log(`[DEBUG API] Found tables via information_schema: ${tablesFound.join(', ')}`);
      } else {
        console.log('[DEBUG API] Information schema query failed, trying direct table access');
      }
    } catch (schemaError) {
      console.log('[DEBUG API] Error with information_schema query:', schemaError);
    }
    
    // Direct table checks if information_schema approach failed
    if (!tablesExist) {
      try {
        // Check daily_yield_curves table
        const { count: dailyTableCount, error: dailyError } = await supabaseAdmin
          .from('daily_yield_curves')
          .select('*', { count: 'exact', head: true });
        
        if (!dailyError) {
          tablesFound.push('daily_yield_curves');
          dailyCount = dailyTableCount || 0;
        }
      } catch (e) {
        console.log('[DEBUG API] daily_yield_curves table check failed');
      }
      
      try {
        // Check yield_curve_sparklines table
        const { count: sparklineTableCount, error: sparklineError } = await supabaseAdmin
          .from('yield_curve_sparklines')
          .select('*', { count: 'exact', head: true });
        
        if (!sparklineError) {
          tablesFound.push('yield_curve_sparklines');
          sparklineCount = sparklineTableCount || 0;
        }
      } catch (e) {
        console.log('[DEBUG API] yield_curve_sparklines table check failed');
      }
      
      tablesExist = tablesFound.length === 2;
    }
    
    // If we confirmed tables exist, get the counts and sample data
    if (tablesExist || tablesFound.length > 0) {
      // Get count of daily records if we haven't already
      if (dailyCount === 0 && tablesFound.includes('daily_yield_curves')) {
        try {
          const { count: dailyRecordCount, error: dailyCountError } = await supabaseAdmin
            .from('daily_yield_curves')
            .select('*', { count: 'exact', head: true });
          
          if (!dailyCountError) {
            dailyCount = dailyRecordCount || 0;
          }
        } catch (e) {
          console.log('[DEBUG API] Failed to count daily records:', e);
        }
      }
      
      // Get count of sparkline records if we haven't already
      if (sparklineCount === 0 && tablesFound.includes('yield_curve_sparklines')) {
        try {
          const { count: sparklineRecordCount, error: sparklineCountError } = await supabaseAdmin
            .from('yield_curve_sparklines')
            .select('*', { count: 'exact', head: true });
          
          if (!sparklineCountError) {
            sparklineCount = sparklineRecordCount || 0;
          }
        } catch (e) {
          console.log('[DEBUG API] Failed to count sparkline records:', e);
        }
      }
      
      // Get latest daily record
      if (dailyCount > 0) {
        try {
          const { data: latestDailyData, error: latestDailyError } = await supabaseAdmin
            .from('daily_yield_curves')
            .select('*')
            .order('date', { ascending: false })
            .limit(1);
          
          if (!latestDailyError && latestDailyData && latestDailyData.length > 0) {
            latestDaily = latestDailyData[0];
          }
        } catch (e) {
          console.log('[DEBUG API] Failed to fetch latest daily record:', e);
        }
      }
      
      // Get recent sparkline records
      if (sparklineCount > 0) {
        try {
          const { data: recentSparklineData, error: recentSparklineError } = await supabaseAdmin
            .from('yield_curve_sparklines')
            .select('*')
            .eq('timeframe', '1m')
            .order('date', { ascending: false })
            .limit(5);
          
          if (!recentSparklineError && recentSparklineData) {
            recentSparklines = recentSparklineData;
          }
        } catch (e) {
          console.log('[DEBUG API] Failed to fetch recent sparkline records:', e);
        }
      }
    }
    
    // Prepare response
    const response = {
      databaseStatus: {
        tablesExist,
        tablesFound,
        dailyRecordsCount: dailyCount,
        sparklineRecordsCount: sparklineCount
      },
      latestDailyRecord: latestDaily,
      recentSparklineRecords: recentSparklines,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.split('://')[1] 
        : 'not-configured'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[DEBUG API] Error in yield-curve-db debug endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check yield curve database',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 