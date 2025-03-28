'use client';

import React, { useEffect, useRef } from 'react';

// Define properties for the TradingView widget
export interface TradingViewChartProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  container?: string;
  className?: string;
  interval?: string;
  chartStyle?: string;
  showToolbar?: boolean;
  showGridLines?: boolean;
  backgroundColor?: string;
}

export function TradingViewChart({
  symbol,
  width = '100%',
  height = '300px',
  theme = 'light',
  container,
  className,
  interval = 'D',
  chartStyle = '1',
  showToolbar = false,
  showGridLines = true,
  backgroundColor,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Create a container ID if not provided
    const containerId = container || `tradingview_${Math.random().toString(36).substring(2, 15)}`;
    
    // Ensure the container has an ID
    if (containerRef.current) {
      containerRef.current.id = containerId;
    }

    // Safely remove any existing script
    const safeRemoveScript = () => {
      if (scriptRef.current) {
        try {
          const parentNode = scriptRef.current.parentNode;
          if (parentNode) {
            parentNode.removeChild(scriptRef.current);
          }
        } catch (e) {
          console.warn('Error removing TradingView script:', e);
        }
        scriptRef.current = null;
      }
    };

    // Clean up any existing scripts before creating a new one
    safeRemoveScript();

    // Create new script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore - TradingView widget is loaded via script
      if (typeof TradingView !== 'undefined' && containerRef.current) {
        try {
          // @ts-ignore
          new TradingView.widget({
            autosize: true,
            symbol: symbol,
            interval: interval,
            timezone: 'Etc/UTC',
            theme: theme,
            style: chartStyle,
            locale: 'en',
            toolbar_bg: backgroundColor || '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: false,
            container_id: containerId,
            hide_top_toolbar: !showToolbar,
            hide_side_toolbar: false,
            withdateranges: true,
            hide_legend: false,
            save_image: true,
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650',
            studies: ['RSI@tv-basicstudies'],
            grid_lines: showGridLines,
            backgroundColor: backgroundColor || null,
          });
        } catch (e) {
          console.error('Error initializing TradingView widget:', e);
        }
      }
    };

    // Store the script reference before adding it to the DOM
    scriptRef.current = script;
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      safeRemoveScript();
    };
  }, [symbol, theme, container, interval, chartStyle, showToolbar, showGridLines, backgroundColor]);

  return (
    <div 
      ref={containerRef} 
      style={{ width, height }}
      className={className}
    />
  );
} 