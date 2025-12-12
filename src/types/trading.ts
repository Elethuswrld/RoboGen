export type Candle = {
  symbol: string;
  timeframe: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Signal = {
  type: "open" | "close" | "modify";
  symbol: string;
  side?: "buy" | "sell";
  price?: number;
  slPips?: number;
  tpPips?: number;
  meta?: Record<string, unknown>;
};

export type Position = {
  id: string;
  ticket: number;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  profit: number;
  openTime: number;
  status?: "open" | "closed" | "pending";
};

export type Order = {
  id: string;
  ticket: number;
  symbol: string;
  type: "limit" | "stop" | "market";
  side: "buy" | "sell";
  volume: number;
  price: number;
  sl: number;
  tp: number;
  status: "pending" | "filled" | "cancelled";
  createdAt: number;
};

export type AccountInfo = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  currency: string;
};

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

export type Strategy = {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
};

// Extended Risk Settings v2
export type RiskSettings = {
  maxDailyDrawdownPct: number;
  maxWeeklyDrawdownPct: number;
  defaultRiskPct: number;
  maxConcurrentTrades: number;
  maxTradesPerDay: number;
  spreadFilterPips: number;
  newsFilterMinutes: number;
  hardStopLoss: boolean;
  autoBreakeven: boolean;
  autoBreakevenPips: number;
  trailingStop: boolean;
  trailingStopPips: number;
  sessionFilter: SessionFilter;
};

export type SessionFilter = {
  enabled: boolean;
  allowLondon: boolean;
  allowNewYork: boolean;
  allowTokyo: boolean;
  allowSydney: boolean;
  blockWeekends: boolean;
  blockNewsEvents: boolean;
};

export type BacktestResult = {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  equityCurve: { time: number; equity: number }[];
  trades: BacktestTrade[];
};

export type BacktestTrade = {
  id: string;
  time: number;
  closeTime: number;
  symbol: string;
  side: "buy" | "sell";
  entryPrice: number;
  exitPrice: number;
  volume: number;
  pnl: number;
  pips: number;
  strategy: string;
};

export type BacktestConfig = {
  strategyId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  spread: number;
  slippage: number;
  params: Record<string, number | string | boolean>;
};

// Broker Adapter Types
export type BrokerType = "mt5" | "mt4" | "ctrader" | "binance" | "bybit" | "okx" | "deriv";

export type BrokerConfig = {
  type: BrokerType;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  server?: string;
  login?: number;
  password?: string;
  enabled: boolean;
};

export type BrokerStatus = {
  type: BrokerType;
  connected: boolean;
  latency: number;
  lastHeartbeat: number;
  error?: string;
};

// Notification Types
export type NotificationType = "trade" | "alert" | "report" | "error";
export type NotificationChannel = "telegram" | "email" | "push" | "webhook";

export type NotificationSettings = {
  enabled: boolean;
  channels: {
    telegram: { enabled: boolean; chatId: string; botToken: string };
    email: { enabled: boolean; address: string };
    push: { enabled: boolean };
    webhook: { enabled: boolean; url: string };
  };
  events: {
    tradeOpened: boolean;
    tradeClosed: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
    riskAlert: boolean;
    drawdownWarning: boolean;
    connectionLost: boolean;
  };
};

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
};

export type Log = {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  category: "connection" | "execution" | "strategy" | "risk";
};
