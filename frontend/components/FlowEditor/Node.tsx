"use client";

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Node as NodeType } from './types';

interface NodeProps {
  node: NodeType;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortClick: (portId: string, type: 'input' | 'output', portPos: { x: number; y: number }) => void;
  onPortPositionChange: (portId: string, pos: { x: number; y: number }) => void;
}

export const Node: React.FC<NodeProps> = ({ node, isSelected, onMouseDown, onPortClick, onPortPositionChange }) => {
  const inputPorts = node.ports.filter(p => p.type === 'input');
  const outputPorts = node.ports.filter(p => p.type === 'output');
  const maxPorts = Math.max(inputPorts.length, outputPorts.length);
  const portRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const updatePortPositions = useCallback(() => {
    let hasChanged = false;
    portRefs.current.forEach((portEl, portId) => {
      const rect = portEl.getBoundingClientRect();
      const newPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const lastPos = lastPositionsRef.current.get(portId);
      if (!lastPos || lastPos.x !== newPos.x || lastPos.y !== newPos.y) {
        lastPositionsRef.current.set(portId, newPos);
        onPortPositionChange(portId, newPos);
        hasChanged = true;
      }
    });
  }, [onPortPositionChange]);

  useEffect(() => {
    updatePortPositions();
  }, [node.ports.length, updatePortPositions]);

  useEffect(() => {
    updatePortPositions();
  }, [node.position, updatePortPositions]);

  useEffect(() => {
    const handleResize = () => updatePortPositions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePortPositions]);

  const handlePortClick = (e: React.MouseEvent, portId: string, type: 'input' | 'output') => {
    e.stopPropagation();
    e.preventDefault();
    const portEl = portRefs.current.get(portId);
    if (portEl) {
      const rect = portEl.getBoundingClientRect();
      onPortClick(portId, type, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  };

  return (
    <div
      className="absolute select-none"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: '200px',
      }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          onMouseDown(e, node.id);
        }
      }}
    >
      <div className={`bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg border-2 ${isSelected ? 'border-emerald-400 shadow-emerald-400/50' : 'border-cyan-500'} shadow-lg overflow-visible`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 font-bold text-white text-sm">
          {node.label}
        </div>

        {/* Ports Container */}
        <div className="relative px-2 py-3 space-y-3" style={{ minHeight: `${Math.max(80, maxPorts * 24)}px` }}>
          <div className="flex justify-between items-stretch gap-2">
            {/* Input Ports */}
            <div className="flex flex-col justify-around gap-1 pr-1 text-right text-[11px] text-slate-200">
              {inputPorts.map((port) => (
                <div key={port.id} className="flex items-center gap-2 justify-end">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600">{port.label}</span>
                  <button
                    ref={(el) => {
                      if (el) portRefs.current.set(port.id, el);
                    }}
                    onClick={(e) => handlePortClick(e, port.id, 'input')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    className="w-3 h-3 rounded-full bg-cyan-400 hover:bg-cyan-300 cursor-pointer transition-colors flex-shrink-0 ring-2 ring-slate-700"
                    style={{
                      marginLeft: '-10px',
                    }}
                    title={`${port.label} (${port.dataType})`}
                    type="button"
                  />
                </div>
              ))}
            </div>

            {/* Label */}
            <div className="text-center text-xs text-gray-100 flex-1 flex items-center justify-center">
              {node.label}
            </div>

            {/* Output Ports */}
            <div className="flex flex-col justify-around gap-1 pl-1 text-left text-[11px] text-slate-200">
              {outputPorts.map((port) => (
                <div key={port.id} className="flex items-center gap-2">
                  <button
                    ref={(el) => {
                      if (el) portRefs.current.set(port.id, el);
                    }}
                    onClick={(e) => handlePortClick(e, port.id, 'output')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    className="w-3 h-3 rounded-full bg-emerald-400 hover:bg-emerald-300 cursor-pointer transition-colors flex-shrink-0 ring-2 ring-slate-700"
                    style={{
                      marginRight: '-10px',
                    }}
                    title={`${port.label} (${port.dataType})`}
                    type="button"
                  />
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600">{port.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Params preview */}
          {Object.keys(node.params || {}).length > 0 && (
            <div className="bg-slate-800/80 border border-slate-600 rounded-md px-2 py-1 text-[11px] text-slate-200 flex flex-wrap gap-1">
              {Object.entries(node.params).map(([key, value]) => (
                <span key={key} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  {key}: <span className="text-emerald-300">{String(value)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
