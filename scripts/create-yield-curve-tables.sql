-- Create a table for daily yield curve data
CREATE TABLE IF NOT EXISTS public.daily_yield_curves (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  spread DECIMAL(10, 6) NOT NULL,  -- The 10Y-2Y spread value
  ten_year_yield DECIMAL(10, 6) NOT NULL,  -- 10-year Treasury yield
  two_year_yield DECIMAL(10, 6) NOT NULL,  -- 2-year Treasury yield
  status VARCHAR(10) NOT NULL CHECK (status IN ('normal', 'warning', 'danger', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create a table for yield curve sparkline data (used for charts)
CREATE TABLE IF NOT EXISTS public.yield_curve_sparklines (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  timeframe VARCHAR(5) NOT NULL CHECK (timeframe IN ('1m', '3m', '6m', '1y', '2y', '5y', '10y', 'max')),
  spread DECIMAL(10, 6) NOT NULL,  -- The historical spread value for this date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (date, timeframe)  -- Prevent duplicate date/timeframe combinations
);

-- Add index on date for both tables
CREATE INDEX IF NOT EXISTS daily_yield_curves_date_idx ON public.daily_yield_curves (date);
CREATE INDEX IF NOT EXISTS yield_curve_sparklines_date_idx ON public.yield_curve_sparklines (date);
CREATE INDEX IF NOT EXISTS yield_curve_sparklines_timeframe_idx ON public.yield_curve_sparklines (timeframe);

-- Add comments for documentation
COMMENT ON TABLE public.daily_yield_curves IS 'Stores daily yield curve data with the latest 10Y-2Y spread';
COMMENT ON TABLE public.yield_curve_sparklines IS 'Stores historical yield curve data for generating sparkline charts';

-- Enable Row Level Security (RLS) but allow full access for now
ALTER TABLE public.daily_yield_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_curve_sparklines ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now
-- In a production environment with authenticated users, these would be more restrictive
CREATE POLICY daily_yield_curves_all_access ON public.daily_yield_curves FOR ALL USING (true);
CREATE POLICY yield_curve_sparklines_all_access ON public.yield_curve_sparklines FOR ALL USING (true); 