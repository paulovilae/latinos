// ... existing code ...
import { NodeType, Port, NodeData, Node, Connection } from './types';

export const createNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createConnectionId = () => `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const nodeTemplates: Record<NodeType, Omit<NodeData, 'id' | 'position'>> = {
  marketData: {
    type: NodeType.MARKET_DATA,
    label: 'Market Data',
    params: { symbol: 'AAPL', field: 'close' },
    ports: [
      { id: 'outClose', nodeId: '', type: 'output' as const, dataType: 'number', label: 'Close' },
      { id: 'outOpen', nodeId: '', type: 'output' as const, dataType: 'number', label: 'Open' },
      { id: 'outHigh', nodeId: '', type: 'output' as const, dataType: 'number', label: 'High' },
      { id: 'outLow', nodeId: '', type: 'output' as const, dataType: 'number', label: 'Low' },
      { id: 'outVolume', nodeId: '', type: 'output' as const, dataType: 'number', label: 'Volume' },
    ],
  },
  sma: {
    type: NodeType.SMA,
    label: 'SMA',
    params: { period: 20 },
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'price' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'number', label: 'sma' },
    ],
  },
  rsi: {
    type: NodeType.RSI,
    label: 'RSI',
    params: { period: 14 },
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'price' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'number', label: 'rsi' },
    ],
  },
  greaterThan: {
    type: NodeType.GREATER_THAN,
    label: '>',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  lessThan: {
    type: NodeType.LESS_THAN,
    label: '<',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  greaterEqual: {
    type: NodeType.GREATER_EQUAL,
    label: '≥',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  lessEqual: {
    type: NodeType.LESS_EQUAL,
    label: '≤',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  equal: {
    type: NodeType.EQUAL,
    label: '=',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  notEqual: {
    type: NodeType.NOT_EQUAL,
    label: '≠',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  add: {
    type: NodeType.ADD,
    label: '+',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'number', label: 'result' },
    ],
  },
  subtract: {
    type: NodeType.SUBTRACT,
    label: '−',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'number', label: 'result' },
    ],
  },
  multiply: {
    type: NodeType.MULTIPLY,
    label: '×',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'number', label: 'result' },
    ],
  },
  divide: {
    type: NodeType.DIVIDE,
    label: '÷',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'number', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'number', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'number', label: 'result' },
    ],
  },
  and: {
    type: NodeType.AND,
    label: 'AND',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'boolean', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'boolean', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  or: {
    type: NodeType.OR,
    label: 'OR',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'boolean', label: 'A' },
      { id: 'in2', nodeId: '', type: 'input' as const, dataType: 'boolean', label: 'B' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  not: {
    type: NodeType.NOT,
    label: 'NOT',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'boolean', label: 'A' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'boolean', label: 'result' },
    ],
  },
  entrySignal: {
    type: NodeType.ENTRY_SIGNAL,
    label: 'Entry Signal',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'boolean', label: 'condition' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'signal', label: 'entry' },
    ],
  },
  exitSignal: {
    type: NodeType.EXIT_SIGNAL,
    label: 'Exit Signal',
    params: {},
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'boolean', label: 'condition' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'signal', label: 'exit' },
    ],
  },
  riskManager: {
    type: NodeType.RISK_MANAGER,
    label: 'Risk Manager',
    params: { maxExposure: 0.2, stopLoss: '2 ATR' },
    ports: [
      { id: 'in1', nodeId: '', type: 'input' as const, dataType: 'signal', label: 'signal' },
      { id: 'out1', nodeId: '', type: 'output' as const, dataType: 'signal', label: 'riskAdjusted' },
    ],
  },
  formulaOutput: {
    type: NodeType.FORMULA_OUTPUT,
    label: 'Formula Output',
    params: {},
    ports: [
      { id: 'inEntry', nodeId: '', type: 'input' as const, dataType: 'signal', label: 'entry' },
      { id: 'inExit', nodeId: '', type: 'input' as const, dataType: 'signal', label: 'exit' },
      { id: 'inRisk', nodeId: '', type: 'input' as const, dataType: 'signal', label: 'risk' },
    ],
  },
};

export const createNode = (type: NodeType, position: { x: number; y: number } = { x: 0, y: 0 }): Node => ({
  id: createNodeId(),
  selected: false,
  ...nodeTemplates[type],
  position,
});

export const createConnection = (from: { nodeId: string; portId: string }, to: { nodeId: string; portId: string }): Connection => ({
  id: createConnectionId(),
  from,
  to,
});