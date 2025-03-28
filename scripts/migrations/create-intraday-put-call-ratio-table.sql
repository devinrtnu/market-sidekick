-- Migration file to create intraday put-call ratio table
-- This table stores intraday (30-minute) snapshots of put/call ratio data

-- Create intraday put-call ratios table
create table public.intraday_put_call_ratios (
  id bigint generated always as identity primary key,
  timestamp timestamptz not null,
  date date not null,
  time_of_day time not null,
  ratio_value numeric(5,2) not null,
  puts_volume bigint,
  calls_volume bigint,
  total_volume bigint,
  status text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add table comment
comment on table public.intraday_put_call_ratios is 'Intraday (30-minute) snapshots of put/call ratio data from CBOE';

-- Add column comments
comment on column public.intraday_put_call_ratios.timestamp is 'Exact timestamp when the data was recorded';
comment on column public.intraday_put_call_ratios.date is 'Date component of the timestamp (for easier querying)';
comment on column public.intraday_put_call_ratios.time_of_day is 'Time component of the timestamp (for easier querying)';
comment on column public.intraday_put_call_ratios.ratio_value is 'The put/call ratio value';
comment on column public.intraday_put_call_ratios.puts_volume is 'Volume of put options (if available)';
comment on column public.intraday_put_call_ratios.calls_volume is 'Volume of call options (if available)';
comment on column public.intraday_put_call_ratios.total_volume is 'Total volume of options (if available)';
comment on column public.intraday_put_call_ratios.status is 'Status based on ratio value (normal, warning, danger)';

-- Add indexes for efficient querying
create index idx_intraday_pcr_date on public.intraday_put_call_ratios(date);
create index idx_intraday_pcr_timestamp on public.intraday_put_call_ratios(timestamp);

-- Rename existing table to be more descriptive (daily data)
alter table public.put_call_ratios rename to daily_put_call_ratios;
comment on table public.daily_put_call_ratios is 'Daily put/call ratio data (end-of-day readings)';

-- Add function to insert the latest intraday reading as a daily record at 3:15 PM
create or replace function public.record_eod_put_call_ratio()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_record public.intraday_put_call_ratios;
  today_date date := current_date;
begin
  -- Get the latest intraday record
  select * into latest_record
  from public.intraday_put_call_ratios
  where date = today_date
  order by timestamp desc
  limit 1;
  
  -- If we have a record, insert/update it in the daily table
  if found then
    insert into public.daily_put_call_ratios (
      date,
      ratio_value,
      status,
      created_at,
      updated_at
    ) values (
      today_date,
      latest_record.ratio_value,
      latest_record.status,
      now(),
      now()
    )
    on conflict (date) do update
    set
      ratio_value = latest_record.ratio_value,
      status = latest_record.status,
      updated_at = now();
      
    raise notice 'Recorded end-of-day put/call ratio % for %', latest_record.ratio_value, today_date;
  else
    raise notice 'No intraday put/call ratio data found for today (%)', today_date;
  end if;
end;
$$; 