"use client";

import {
  Area,
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { Signal } from "@/lib/types";
import { LocalizedText } from "./LocalizedText";

type MarketPoint = {
  timestamp: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
};

interface PriceChartProps {
  symbol: string;
  data: MarketPoint[];
  signals?: Signal[];
  showSMA?: boolean;
  showVolume?: boolean;
}

// Simple SMA helper
function calculateSMA(data: MarketPoint[], period: number) {
  const smaData = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      smaData.push({ ...data[i], sma: null });
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.close, 0);
    smaData.push({ ...data[i], sma: sum / period });
  }
  return smaData;
}

export function PriceChart({ symbol, data, signals = [], showSMA = false, showVolume = false }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
        <p className="text-slate-500">
            <LocalizedText id="chartLoading" fallback="Loading chart..." />
        </p>
      </div>
    );
  }

  // Pre-process data for indicators
  // We attach 'sma' to the data points directly
  let chartData = data;
  if (showSMA) {
      // Calculate SMA 20
      const sma = calculateSMA(data, 20);
      chartData = sma.map((d, i) => ({ ...d, sma20: d.sma }));
      // Could allow multiple SMAs
  }

  // Calculate scales
  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices) * 0.99;
  const maxPrice = Math.max(...prices) * 1.01;

  // Volume scale (separate axis or normalized? Separate axis is better in ComposedChart)
  
  return (
    <div className="w-full" style={{ height: 400, minHeight: 400 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          
          <XAxis
            dataKey="timestamp"
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(str) => new Date(str).toLocaleDateString()}
            stroke="#1e293b"
            minTickGap={30}
          />
          
          {/* Price Axis */}
          <YAxis
            yAxisId="price"
            domain={[minPrice, maxPrice]}
            tick={{ fill: "#64748b", fontSize: 12 }}
            stroke="#1e293b"
            orientation="right"
          />

          {/* Volume Axis - Hidden but used for scaling */}
          {showVolume && (
              <YAxis
                yAxisId="volume"
                orientation="left"
                tick={false}
                axisLine={false}
                domain={[0, 'auto']} 
              />
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#1e293b",
              color: "#f8fafc",
            }}
            itemStyle={{ color: "#10b981" }}
            labelStyle={{ color: "#94a3b8" }}
            labelFormatter={(label) => new Date(label).toLocaleString()}
          />
          
          {/* Main Price Area */}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
            name="Price"
          />

          {/* SMA Line */}
          {showSMA && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="sma20" 
                stroke="#6366f1" 
                strokeWidth={2} 
                dot={false}
                name="SMA 20"
              />
          )}

          {/* Volume Bars */}
          {showVolume && (
              <Bar 
                  yAxisId="volume" 
                  dataKey="volume" 
                  fill="#8b5cf6" 
                  opacity={0.3} 
                  barSize={4}
                  name="Volume"
              />
          )}

          {/* Signal Dots */}
          {signals.map((signal, idx) => {
             const isBuy = signal.type === "buy";
             return (
               <ReferenceDot
                 key={signal.id}
                 yAxisId="price"
                 x={signal.emitted_at.split("T")[0]} 
                 y={minPrice} 
                 r={4}
                 fill={isBuy ? "#10b981" : "#f43f5e"}
                 stroke="white"
                 strokeWidth={1}
               />
             );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
