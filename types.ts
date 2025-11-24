export interface MarketData {
  timestamp: number;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volatility: number; // 0-100
}

export enum SignalAction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  STRONG_BUY = 'STRONG_BUY',
  STRONG_SELL = 'STRONG_SELL',
}

export interface AISignal {
  id: string;
  timestamp: number;
  action: SignalAction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number; // 0-100
  reasoning: string;
  isAggressive: boolean;
}

export interface AppConfig {
  apiUrl: string;
  refreshRate: number; // ms
  isSimulation: boolean;
}

export interface ChartPoint {
  time: string;
  value: number;
}
