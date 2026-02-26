"use client";

import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

export interface OHLCData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TradingViewChartProps {
  data: OHLCData[];
  height?: number;
}

export function TradingViewChart({ data, height = 400 }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  // Defaulting to dark mode for the broker aesthetics
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // If you want to sync with a global theme later, do it here.
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({
        width: chartContainerRef.current?.clientWidth,
      });
    };

    const isDark = currentTheme === "dark";
    
    // TradingView Advanced Colors
    const backgroundColor = isDark ? "#0f172a" : "#ffffff"; // Tailwind slate-950/white
    const textColor = isDark ? "#94a3b8" : "#475569"; // Tailwind slate-400/600
    const gridColor = isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(226, 232, 240, 0.5)"; // slate-800/200

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: "solid", color: backgroundColor } as any,
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: gridColor,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      crosshair: {
          mode: 1, // Normal crosshair
          vertLine: {
              color: isDark ? '#334155' : '#cbd5e1', // slate-700/300
              labelBackgroundColor: isDark ? '#1e293b' : '#f1f5f9', // slate-800/100
          },
          horzLine: {
              color: isDark ? '#334155' : '#cbd5e1',
              labelBackgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          }
      }
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981', // emerald-500
        downColor: '#f43f5e', // rose-500
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
    });
    
    seriesRef.current = candlestickSeries;

    if (data && data.length > 0) {
        // Sort and deduplicate data for TV requirements
        const sortedUniqueData = Array.from(new Map(data
            .filter(item => !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close))
            .map(item => [item.time, item])).values())
            .sort((a, b) => (a.time as number) - (b.time as number));
        
        if (sortedUniqueData.length > 0) {
            candlestickSeries.setData(sortedUniqueData);
            chart.timeScale().fitContent();
        }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [data, currentTheme, height]);

  // Update data if it changes without remounting the entire chart
  useEffect(() => {
      if (seriesRef.current && chartRef.current && data && data.length > 0) {
          try {
             const validData = data.filter(item => !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close));
             const sortedUniqueData = Array.from(new Map(validData.map(item => [item.time, item])).values())
                .sort((a, b) => (a.time as number) - (b.time as number));
             
             seriesRef.current.setData(sortedUniqueData);
             
             // Force the chart to gracefully zoom and fill the container whenever data changes
             setTimeout(() => {
                 chartRef.current?.timeScale().fitContent();
             }, 50);
             
          } catch(e) {
             console.error("Error setting TV chart data:", e);
          }
      }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full relative overflow-hidden rounded-xl border border-slate-800 shadow-inner" style={{ height }} />;
}
