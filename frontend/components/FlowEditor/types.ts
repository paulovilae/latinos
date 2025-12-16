// ... existing code ...
export enum NodeType {
  MARKET_DATA = 'marketData',
  SMA = 'sma',
  RSI = 'rsi',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_EQUAL = 'greaterEqual',
  LESS_EQUAL = 'lessEqual',
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  AND = 'and',
  OR = 'or',
  NOT = 'not',
  ENTRY_SIGNAL = 'entrySignal',
  EXIT_SIGNAL = 'exitSignal',
  RISK_MANAGER = 'riskManager',
  FORMULA_OUTPUT = 'formulaOutput',
}

export interface Port {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  dataType: 'number' | 'boolean' | 'signal' | 'asset';
  label: string;
}

export interface NodeData {
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  params: Record<string, any>;
  ports: Port[];
}

export interface Node extends NodeData {
  id: string;
  selected?: boolean;
}

export interface Connection {
  id: string;
  from: { nodeId: string; portId: string };
  to: { nodeId: string; portId: string };
}

export interface FlowState {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId?: string;
  zoom: number;
  pan: { x: number; y: number };
  connectorStyle?: 'bezier' | 'straight';
}
