-- Create a table for put-call ratio data
CREATE TABLE IF NOT EXISTS public.put_call_ratios (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  value DECIMAL(10, 6) NOT NULL,  -- The put-call ratio value
  intraday BOOLEAN NOT NULL DEFAULT FALSE,  -- Whether this is intraday data
  timeframe VARCHAR(5) DEFAULT '1d' NOT NULL CHECK (timeframe IN ('1d', '1h', '5m')),
  notes VARCHAR(255),  -- Optional notes about the data point
  status VARCHAR(10) NOT NULL CHECK (status IN ('normal', 'warning', 'danger', 'error')),
  source VARCHAR(50),  -- Source of the data (e.g., 'CBOE', 'OCC')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create a table for put-call ratio historical data (used for charts)
CREATE TABLE IF NOT EXISTS public.put_call_ratio_history (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  timeframe VARCHAR(5) NOT NULL CHECK (timeframe IN ('1d', '1w', '1m', '3m', '6m', '1y', 'max')),
  value DECIMAL(10, 6) NOT NULL,  -- The historical ratio value for this date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (date, timeframe)  -- Prevent duplicate date/timeframe combinations
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS put_call_ratios_date_idx ON public.put_call_ratios (date);
CREATE INDEX IF NOT EXISTS put_call_ratios_intraday_idx ON public.put_call_ratios (intraday);
CREATE INDEX IF NOT EXISTS put_call_ratio_history_date_idx ON public.put_call_ratio_history (date);
CREATE INDEX IF NOT EXISTS put_call_ratio_history_timeframe_idx ON public.put_call_ratio_history (timeframe);

-- Add comments for documentation
COMMENT ON TABLE public.put_call_ratios IS 'Stores daily and intraday put-call ratio data';
COMMENT ON TABLE public.put_call_ratio_history IS 'Stores historical put-call ratio data for generating charts';

-- Enable Row Level Security (RLS) but allow full access for now
ALTER TABLE public.put_call_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.put_call_ratio_history ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now
-- In a production environment with authenticated users, these would be more restrictive
CREATE POLICY put_call_ratios_all_access ON public.put_call_ratios FOR ALL USING (true);
CREATE POLICY put_call_ratio_history_all_access ON public.put_call_ratio_history FOR ALL USING (true); 