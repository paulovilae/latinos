// ... existing code ...
"use client";

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { FlowState } from './types';
import { NodeType } from './types';
import { FlowCanvas } from './Canvas';
import { createNode } from './nodes';

interface FlowEditorProps {
  onExport: (flowState: FlowState) => void;
}

type DataFeed = {
  id: string;
  title: string;
  subtitle: string;
  series: number[];
  color: string;
  lastValue: number;
};

const COLOR_PALETTE = ['#34d399', '#60a5fa', '#f472b6', '#f59e0b', '#a78bfa', '#38bdf8', '#22d3ee'];

const sparklinePath = (values: number[], width = 200, height = 64) => {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};

const Sparkline: React.FC<{ series: number[]; color: string }> = ({ series, color }) => {
  const width = 200;
  const height = 64;
  const path = sparklinePath(series, width, height);
  const gradientId = useMemo(() => `spark-${Math.random().toString(36).slice(2)}`, []);
  if (!path) return <div className="text-xs text-slate-400">Waiting for ticks…</div>;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const last = series[series.length - 1];

  return (
    <svg className="w-full h-20" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={`${color}66`} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d={`M 0 ${height} L ${path} L ${width} ${height} Z`}
        fill={`url(#${gradientId})`}
        stroke="none"
      />
      <polyline
        points={path}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((last - min) / range) * height}
        r="3.5"
        fill="white"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
};

export const FlowEditor: React.FC<FlowEditorProps> = ({ onExport }) => {
  const initialFlowState = useMemo<FlowState>(() => ({
    nodes: [
      { ...createNode(NodeType.MARKET_DATA, { x: 50, y: 50 }), id: 'node_market_1' },
      { ...createNode(NodeType.SMA, { x: 300, y: 50 }), id: 'node_sma_1' },
      { ...createNode(NodeType.GREATER_THAN, { x: 550, y: 50 }), id: 'node_gt_1' },
      { ...createNode(NodeType.ENTRY_SIGNAL, { x: 800, y: 50 }), id: 'node_entry_1' },
    ],
    connections: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    connectorStyle: 'bezier',
  }), []);

  const [flowState, setFlowState] = useState<FlowState>(initialFlowState);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);

  const handleFlowChange = useCallback((next: FlowState) => {
    setFlowState(next);
  }, []);

  const moveFeed = useCallback((id: string, direction: -1 | 1) => {
    setDataFeeds((prev) => {
      const index = prev.findIndex((feed) => feed.id === id);
      if (index === -1) return prev;
      const target = Math.min(prev.length - 1, Math.max(0, index + direction));
      if (target === index) return prev;
      const clone = [...prev];
      const [item] = clone.splice(index, 1);
      clone.splice(target, 0, item);
      return clone;
    });
  }, []);

  const selectedNode = useMemo(
    () => flowState.nodes.find((node) => node.id === flowState.selectedNodeId),
    [flowState.nodes, flowState.selectedNodeId]
  );

  const selectedConnections = useMemo(
    () =>
      selectedNode
        ? flowState.connections.filter(
            (conn) => conn.from.nodeId === selectedNode.id || conn.to.nodeId === selectedNode.id
          )
        : [],
    [selectedNode, flowState.connections]
  );

  const connectionSummary = useMemo(
    () =>
      flowState.connections.map((conn) => {
        const fromNode = flowState.nodes.find((n) => n.id === conn.from.nodeId);
        const toNode = flowState.nodes.find((n) => n.id === conn.to.nodeId);
        return `${fromNode?.label ?? conn.from.nodeId} → ${toNode?.label ?? conn.to.nodeId}`;
      }),
    [flowState.connections, flowState.nodes]
  );

  const flowJson = useMemo(
    () =>
      JSON.stringify(
        {
          nodes: flowState.nodes,
          connections: flowState.connections,
        },
        null,
        2
      ),
    [flowState.nodes, flowState.connections]
  );

  useEffect(() => {
    // Keep data feeds in sync with available output ports
    setDataFeeds((prev) => {
      const prevMap = new Map(prev.map(feed => [feed.id, feed]));
      const feeds: DataFeed[] = flowState.nodes.flatMap((node, nodeIdx) =>
        node.ports
          .filter((port) => port.type === 'output')
          .map((port, portIdx) => {
            const id = `${node.id}-${port.id}`;
            const existing = prevMap.get(id);
            return {
              id,
              title: `${node.label} • ${port.label}`,
              subtitle: `${port.dataType} stream`,
              color: existing?.color ?? COLOR_PALETTE[(nodeIdx + portIdx) % COLOR_PALETTE.length],
              series: existing?.series ?? [],
              lastValue: existing?.lastValue ?? 0,
            };
          })
      );
      return feeds;
    });
  }, [flowState.nodes]);

  useEffect(() => {
    if (!dataFeeds.length) return;
    
    // Fetch real market data for each feed
    const fetchMarketData = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      
      for (const feed of dataFeeds) {
        try {
          // Extract symbol from feed title or use default
          const symbols = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA", "META"];
          const symbol = symbols[Math.floor(Math.random() * symbols.length)];
          
          const response = await fetch(
            `${apiBase}/market-data/${symbol}?interval=1d&range=1mo`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.points && data.points.length > 0) {
              const series = data.points.map((p: any) => p.close);
              const lastValue = series[series.length - 1];
              
              setDataFeeds((prev) =>
                prev.map((f) =>
                  f.id === feed.id
                    ? { ...f, series, lastValue }
                    : f
                )
              );
            }
          }
        } catch (error) {
          console.error(`Failed to fetch market data for ${feed.id}:`, error);
        }
      }
    };
    
    fetchMarketData();
    
    // Update with live ticks every 5 seconds
    const interval = setInterval(() => {
      setDataFeeds((prev) =>
        prev.map((feed) => {
          if (feed.series.length === 0) return feed;
          const lastValue = feed.lastValue;
          const volatility = 0.02; // 2% volatility
          const change = (Math.random() - 0.5) * 2 * volatility * lastValue;
          const next = Math.max(lastValue + change, 0.01); // Prevent negative prices
          const series = [...feed.series.slice(-48), next];
          return { ...feed, series, lastValue: next };
        })
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dataFeeds.length]);

  const handleAddNode = useCallback((type: NodeType, canvasPosition: { x: number; y: number }) => {
    const newNode = createNode(type, canvasPosition);
    setFlowState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/node-type') as NodeType;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && type) {
      const x = (e.clientX - rect.left) / flowState.zoom - 100;
      const y = (e.clientY - rect.top) / flowState.zoom - 40;
      handleAddNode(type, { x, y });
    }
  }, [flowState.zoom, handleAddNode]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleExport = useCallback(() => {
    onExport(flowState);
  }, [flowState, onExport]);

  const nodePalette = [
    // Data Sources
    { type: NodeType.MARKET_DATA, label: 'Market Data', icon: '📈', category: 'Data' },
    
    // Indicators
    { type: NodeType.SMA, label: 'SMA', icon: '📊', category: 'Indicators' },
    { type: NodeType.RSI, label: 'RSI', icon: '📉', category: 'Indicators' },
    
    // Comparisons
    { type: NodeType.GREATER_THAN, label: '>', icon: '>', category: 'Comparisons' },
    { type: NodeType.LESS_THAN, label: '<', icon: '<', category: 'Comparisons' },
    { type: NodeType.GREATER_EQUAL, label: '≥', icon: '≥', category: 'Comparisons' },
    { type: NodeType.LESS_EQUAL, label: '≤', icon: '≤', category: 'Comparisons' },
    { type: NodeType.EQUAL, label: '=', icon: '=', category: 'Comparisons' },
    { type: NodeType.NOT_EQUAL, label: '≠', icon: '≠', category: 'Comparisons' },
    
    // Math
    { type: NodeType.ADD, label: 'Add', icon: '+', category: 'Math' },
    { type: NodeType.SUBTRACT, label: 'Subtract', icon: '−', category: 'Math' },
    { type: NodeType.MULTIPLY, label: 'Multiply', icon: '×', category: 'Math' },
    { type: NodeType.DIVIDE, label: 'Divide', icon: '÷', category: 'Math' },
    
    // Logic
    { type: NodeType.AND, label: 'AND', icon: '∧', category: 'Logic' },
    { type: NodeType.OR, label: 'OR', icon: '∨', category: 'Logic' },
    { type: NodeType.NOT, label: 'NOT', icon: '¬', category: 'Logic' },
    
    // Signals
    { type: NodeType.ENTRY_SIGNAL, label: 'Entry', icon: '➤', category: 'Signals' },
    { type: NodeType.EXIT_SIGNAL, label: 'Exit', icon: '⏹️', category: 'Signals' },
    { type: NodeType.RISK_MANAGER, label: 'Risk', icon: '🛡️', category: 'Signals' },
    { type: NodeType.FORMULA_OUTPUT, label: 'Output', icon: '🎯', category: 'Signals' },
  ];

  // Group nodes by category
  const groupedNodes = nodePalette.reduce((acc, node) => {
    const category = node.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(node);
    return acc;
  }, {} as Record<string, typeof nodePalette>);

  const categoryOrder = ['Data', 'Indicators', 'Comparisons', 'Math', 'Logic', 'Signals'];

  return (
    <div className="flex flex-col h-full min-h-[700px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900/50 border-r border-slate-800 p-4 flex flex-col gap-2 flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Formula Nodes</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {categoryOrder.map((category) => (
              <div key={category}>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 py-1 mb-2">{category}</h4>
                <div className="space-y-2">
                  {groupedNodes[category]?.map(({ type, label, icon }) => (
                    <div
                      key={type}
                      className="group p-3 rounded-xl border-2 border-transparent hover:border-slate-600 cursor-grab active:cursor-grabbing bg-slate-800/50 hover:bg-slate-800 transition-all flex items-center gap-3 text-sm shadow-sm hover:shadow-md"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/node-type', type);
                      }}
                    >
                      <span className="text-lg flex-shrink-0">{icon}</span>
                      <span className="truncate">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-2 px-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            📥 Download Template
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 min-h-[600px] relative border-x border-slate-800"
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          <FlowCanvas flowState={flowState} onStateChange={handleFlowChange} />
        </div>

        {/* Properties */}
        <div className="w-80 bg-slate-900/50 border-l border-slate-800 p-4 flex flex-col flex-shrink-0 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Inspector</h3>
          <div className="text-xs text-slate-400 mb-3">
            {flowState.nodes.length} nodes • {flowState.connections.length} connections
          </div>
          <div className="mb-4">
            <label className="text-[11px] text-slate-300 flex items-center justify-between gap-2">
              Connector style
              <select
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                value={flowState.connectorStyle ?? 'bezier'}
                onChange={(e) =>
                  setFlowState((prev) => ({ ...prev, connectorStyle: e.target.value as FlowState['connectorStyle'] }))
                }
              >
                <option value="bezier">Curved</option>
                <option value="straight">Straight</option>
              </select>
            </label>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {selectedNode ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-sm font-semibold text-white">{selectedNode.label}</div>
                  <div className="text-[11px] text-slate-400">Type: {selectedNode.type}</div>
                </div>

                {Object.keys(selectedNode.params || {}).length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                    <div className="text-xs font-semibold text-slate-200">Parameters</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedNode.params).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200">
                          {key}: <span className="text-emerald-300">{String(value)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <div className="text-xs font-semibold text-slate-200">Ports</div>
                  <div className="space-y-1">
                    {selectedNode.ports.map((port) => (
                      <div key={port.id} className="flex items-center justify-between text-[11px] bg-slate-900/60 border border-slate-700 px-2 py-1 rounded">
                        <span className="text-slate-200">{port.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${port.type === 'input' ? 'bg-slate-800 text-cyan-300' : 'bg-emerald-800/50 text-emerald-200'}`}>
                          {port.type} • {port.dataType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <div className="text-xs font-semibold text-slate-200">Wiring</div>
                  {selectedConnections.length === 0 ? (
                    <div className="text-[11px] text-slate-500">No connections yet</div>
                  ) : (
                    <ul className="text-[11px] text-slate-200 space-y-1">
                      {selectedConnections.map((conn) => (
                        <li key={conn.id} className="flex items-center gap-2">
                          <span className="text-cyan-300">{conn.from.portId}</span>
                          <span>→</span>
                          <span className="text-emerald-300">{conn.to.portId}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                Click a node to inspect its parameters, ports and wiring.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live data + JSON - scrollable bottom panel */}
      <div className="border-t border-slate-800 bg-slate-900/60 p-4 space-y-4 max-h-[40%] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Live Data & Formula Preview</h3>
            <p className="text-xs text-slate-400">Streaming mock ticks per connector plus a live JSON snapshot of your formula.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{flowState.nodes.length} nodes • {flowState.connections.length} connections</span>
            <button
              onClick={handleExport}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm border border-slate-700"
            >
              📥 Download Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {dataFeeds.length === 0 ? (
            <div className="col-span-full text-sm text-slate-400 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl p-6 text-center">
              Add nodes and click ports to see streaming values. Outputs become draggable plot cards.
            </div>
          ) : (
            dataFeeds.map((feed, idx) => (
              <div key={feed.id} className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{feed.title}</div>
                    <div className="text-xs text-slate-400">{feed.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveFeed(feed.id, -1)}
                      disabled={idx === 0}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 disabled:opacity-40"
                      title="Move left"
                    >
                      ⇦
                    </button>
                    <button
                      onClick={() => moveFeed(feed.id, 1)}
                      disabled={idx === dataFeeds.length - 1}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 disabled:opacity-40"
                      title="Move right"
                    >
                      ⇨
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-2xl font-bold text-emerald-300">{feed.lastValue.toFixed(2)}</div>
                  <span className="text-[11px] text-slate-400">ports: live</span>
                </div>
                <Sparkline series={feed.series} color={feed.color} />
              </div>
            ))
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">Flow JSON</h4>
              <span className="text-[11px] text-slate-400">Live</span>
            </div>
            <pre className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-auto font-mono">
              {flowJson}
            </pre>
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Connections</h4>
              <span className="text-[11px] text-slate-400">Hover nodes for tooltips</span>
            </div>
            {connectionSummary.length === 0 ? (
              <div className="text-xs text-slate-400">Connect any output to an input to start the signal wiring.</div>
            ) : (
              <ul className="text-xs text-slate-200 space-y-1 max-h-40 overflow-y-auto">
                {connectionSummary.map((text, idx) => (
                  <li key={`${text}-${idx}`} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
