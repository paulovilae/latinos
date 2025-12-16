"use client";

import React, { useCallback, useRef, useState } from 'react';
import { Node, Connection, FlowState } from './types';
import { Node as NodeComponent } from './Node';

interface CanvasProps {
  flowState: FlowState;
  onStateChange: (state: FlowState) => void;
}

interface PortPosition {
  x: number;
  y: number;
}

export const FlowCanvas: React.FC<CanvasProps> = ({ flowState, onStateChange }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ fromNodeId: string; fromPortId: string; fromPos: PortPosition; toPos: PortPosition } | null>(null);
  const [portPositions, setPortPositions] = useState<Map<string, PortPosition>>(new Map());

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    setDragNodeId(nodeId);
    e.stopPropagation();
    onStateChange({ ...flowState, selectedNodeId: nodeId });
  }, [onStateChange, flowState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragNodeId) {
      const node = flowState.nodes.find(n => n.id === dragNodeId);
      if (node) {
        const newX = node.position.x + e.movementX;
        const newY = node.position.y + e.movementY;
        const newNodes = flowState.nodes.map(n =>
          n.id === dragNodeId ? { ...n, position: { x: newX, y: newY } } : n
        );
        onStateChange({ ...flowState, nodes: newNodes });
      }
    }
    if (tempConnection) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const toPos = rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : { x: e.clientX, y: e.clientY };
      setTempConnection(prev => prev ? { ...prev, toPos } : null);
    }
  }, [dragNodeId, tempConnection, flowState, onStateChange]);

  const handleMouseUp = useCallback(() => {
    setDragNodeId(null);
    // do not clear tempConnection here to allow click to complete a link
  }, []);

  const handlePortClick = useCallback((nodeId: string, portId: string, portType: 'input' | 'output', portPos: PortPosition) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const localPos = rect ? { x: portPos.x - rect.left, y: portPos.y - rect.top } : portPos;
    if (portType === 'output') {
      // Start connection from output port
      setTempConnection({
        fromNodeId: nodeId,
        fromPortId: portId,
        fromPos: localPos,
        toPos: localPos,
      });
    } else if (portType === 'input' && tempConnection) {
      // Complete connection to input port
      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        from: { nodeId: tempConnection.fromNodeId, portId: tempConnection.fromPortId },
        to: { nodeId, portId },
      };
      onStateChange({
        ...flowState,
        connections: [...flowState.connections, newConnection],
      });
      setTempConnection(null);
    }
  }, [tempConnection, flowState, onStateChange]);

  const getConnectionPath = (fromNode: Node, fromPortId: string, toNode: Node, toPortId: string) => {
    const fromPortKey = `${fromNode.id}-${fromPortId}`;
    const toPortKey = `${toNode.id}-${toPortId}`;
    const fromPos = portPositions.get(fromPortKey);
    const toPos = portPositions.get(toPortKey);

    if (!fromPos || !toPos) return null;

    if (flowState.connectorStyle === 'straight') {
      return {
        d: `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`,
        fromPos,
        toPos,
      };
    }

    // Cubic bezier curve with proper control points
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlDistance = Math.min(distance / 2, 100);
    
    const cp1x = fromPos.x + controlDistance;
    const cp1y = fromPos.y;
    const cp2x = toPos.x - controlDistance;
    const cp2y = toPos.y;
    
    return {
      d: `M ${fromPos.x} ${fromPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPos.x} ${toPos.y}`,
      fromPos,
      toPos,
    };
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={() => {
        if (flowState.selectedNodeId) {
          onStateChange({ ...flowState, selectedNodeId: undefined });
        }
        if (tempConnection) {
          setTempConnection(null);
        }
      }}
      style={{ pointerEvents: 'auto' }}
    >
      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <defs>
          <style>{`
            @keyframes flowAnimation {
              0% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: -20;
              }
            }
            .animated-connector {
              animation: flowAnimation 1s linear infinite;
            }
          `}</style>
        </defs>
        {/* Connections */}
        {flowState.connections.map((conn) => {
          const fromNode = flowState.nodes.find(n => n.id === conn.from.nodeId);
          const toNode = flowState.nodes.find(n => n.id === conn.to.nodeId);
          if (!fromNode || !toNode) return null;

          const path = getConnectionPath(fromNode, conn.from.portId, toNode, conn.to.portId);
          if (!path) return null;

          return (
            <path
              key={conn.id}
              d={path.d}
              fill="none"
              stroke="hsl(210 100% 60%)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="10,5"
              className="animated-connector"
            />
          );
        })}

        {/* Temp connection */}
        {tempConnection && (
          <path
            d={`M ${tempConnection.fromPos.x} ${tempConnection.fromPos.y} L ${tempConnection.toPos.x} ${tempConnection.toPos.y}`}
            fill="none"
            stroke="hsl(200 100% 50% / 0.8)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Nodes */}
      <div style={{ zIndex: 10 }}>
        {flowState.nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={flowState.selectedNodeId === node.id}
            onMouseDown={handleNodeMouseDown}
            onPortClick={(portId, type, portPos) => handlePortClick(node.id, portId, type, portPos)}
            onPortPositionChange={(portId, pos) => {
              const key = `${node.id}-${portId}`;
              const rect = canvasRef.current?.getBoundingClientRect();
              const localPos = rect ? { x: pos.x - rect.left, y: pos.y - rect.top } : pos;
              setPortPositions(prev => new Map(prev).set(key, localPos));
            }}
          />
        ))}
      </div>
    </div>
  );
};
