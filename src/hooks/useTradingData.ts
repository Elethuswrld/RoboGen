import { useState, useEffect, useCallback } from "react";
import type { 
  Candle, 
  Position, 
  Order, 
  AccountInfo, 
  ConnectionStatus, 
  Strategy, 
  RiskSettings 
} from "@/types/trading";

// Generate mock candle data
const generateCandles = (count: number, symbol: string): Candle[] => {
  const candles: Candle[] = [];
  let price = symbol === "EURUSD" ? 1.0850 : symbol === "GBPUSD" ? 1.2650 : 1850.50;
  const now = Date.now();
  
  for (let i = count; i >= 0; i--) {
    const volatility = price * 0.002;
    const open = price + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      symbol,
      timeframe: "M5",
      time: now - i * 5 * 60 * 1000,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000) + 100,
    });
    
    price = close;
  }
  
  return candles;
};

// Mock positions
const mockPositions: Position[] = [
  {
    id: "1",
    ticket: 12345678,
    symbol: "EURUSD",
    side: "buy",
    volume: 0.1,
    openPrice: 1.0842,
    currentPrice: 1.0856,
    sl: 1.0810,
    tp: 1.0900,
    profit: 14.0,
    openTime: Date.now() - 3600000,
  },
  {
    id: "2",
    ticket: 12345679,
    symbol: "GBPUSD",
    side: "sell",
    volume: 0.05,
    openPrice: 1.2680,
    currentPrice: 1.2665,
    sl: 1.2720,
    tp: 1.2600,
    profit: 7.5,
    openTime: Date.now() - 7200000,
  },
];

// Mock orders
const mockOrders: Order[] = [
  {
    id: "1",
    ticket: 12345680,
    symbol: "XAUUSD",
    type: "limit",
    side: "buy",
    volume: 0.02,
    price: 1845.00,
    sl: 1835.00,
    tp: 1865.00,
    status: "pending",
    createdAt: Date.now() - 1800000,
  },
];

// Mock account
const mockAccount: AccountInfo = {
  balance: 10000.00,
  equity: 10021.50,
  margin: 108.56,
  freeMargin: 9912.94,
  marginLevel: 9230.45,
  profit: 21.50,
  currency: "USD",
};

// Default strategies
const defaultStrategies: Strategy[] = [
  {
    id: "1",
    name: "MA Cross",
    symbol: "EURUSD",
    timeframe: "M5",
    enabled: true,
    params: { fast: 9, slow: 21 },
  },
  {
    id: "2",
    name: "RSI Bands",
    symbol: "GBPUSD",
    timeframe: "M15",
    enabled: false,
    params: { period: 14, overbought: 70, oversold: 30 },
  },
  {
    id: "3",
    name: "Scalper",
    symbol: "XAUUSD",
    timeframe: "M1",
    enabled: false,
    params: { atrPeriod: 14, multiplier: 1.5 },
  },
];

// Default risk settings
const defaultRiskSettings: RiskSettings = {
  maxDailyDrawdownPct: 5,
  maxWeeklyDrawdownPct: 10,
  defaultRiskPct: 1,
  maxConcurrentTrades: 5,
  maxTradesPerDay: 10,
  spreadFilterPips: 3,
  newsFilterMinutes: 30,
  hardStopLoss: true,
  autoBreakeven: false,
  autoBreakevenPips: 20,
  trailingStop: false,
  trailingStopPips: 15,
  sessionFilter: {
    enabled: false,
    allowLondon: true,
    allowNewYork: true,
    allowTokyo: true,
    allowSydney: true,
    blockWeekends: true,
    blockNewsEvents: true,
  },
};

export const useTradingData = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [positions, setPositions] = useState<Position[]>(mockPositions);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [account, setAccount] = useState<AccountInfo>(mockAccount);
  const [strategies, setStrategies] = useState<Strategy[]>(defaultStrategies);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(defaultRiskSettings);
  const [isTrading, setIsTrading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("EURUSD");
  const [logs, setLogs] = useState<{ time: number; level: string; message: string }[]>([]);

  // Initialize candles
  useEffect(() => {
    setCandles(generateCandles(100, selectedSymbol));
  }, [selectedSymbol]);

  // Simulate live updates
  useEffect(() => {
    if (connectionStatus !== "connected") return;

    const interval = setInterval(() => {
      // Update candles
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const volatility = last.close * 0.0005;
        const newClose = last.close + (Math.random() - 0.5) * volatility;
        
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          close: newClose,
          high: Math.max(last.high, newClose),
          low: Math.min(last.low, newClose),
        };
        return updated;
      });

      // Update positions
      setPositions((prev) =>
        prev.map((pos) => {
          const change = (Math.random() - 0.5) * 0.0002;
          const newPrice = pos.currentPrice + (pos.symbol.includes("XAU") ? change * 1000 : change);
          const priceDiff = pos.side === "buy" 
            ? newPrice - pos.openPrice 
            : pos.openPrice - newPrice;
          const pipValue = pos.symbol.includes("XAU") ? 1 : 10000;
          const profit = priceDiff * pipValue * pos.volume * 100;
          
          return {
            ...pos,
            currentPrice: newPrice,
            profit: Number(profit.toFixed(2)),
          };
        })
      );

      // Update account
      setAccount((prev) => {
        const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
        return {
          ...prev,
          equity: prev.balance + totalProfit,
          profit: totalProfit,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus, positions]);

  const connect = useCallback(() => {
    setConnectionStatus("connecting");
    addLog("info", "Connecting to MT5 bridge...");
    
    setTimeout(() => {
      setConnectionStatus("connected");
      addLog("success", "Connected to MT5 bridge successfully");
    }, 1500);
  }, []);

  const disconnect = useCallback(() => {
    setConnectionStatus("disconnected");
    setIsTrading(false);
    addLog("info", "Disconnected from MT5 bridge");
  }, []);

  const startTrading = useCallback(() => {
    if (connectionStatus !== "connected") return;
    setIsTrading(true);
    addLog("success", "Trading started - strategies are now active");
  }, [connectionStatus]);

  const stopTrading = useCallback(() => {
    setIsTrading(false);
    addLog("warning", "Trading stopped - strategies paused");
  }, []);

  const toggleStrategy = useCallback((id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const updateRiskSettings = useCallback((settings: Partial<RiskSettings>) => {
    setRiskSettings((prev) => ({ ...prev, ...settings }));
    addLog("info", "Risk settings updated");
  }, []);

  const addLog = useCallback((level: string, message: string) => {
    setLogs((prev) => [
      { time: Date.now(), level, message },
      ...prev.slice(0, 99),
    ]);
  }, []);

  const closePosition = useCallback((id: string) => {
    const pos = positions.find((p) => p.id === id);
    if (pos) {
      setPositions((prev) => prev.filter((p) => p.id !== id));
      setAccount((prev) => ({
        ...prev,
        balance: prev.balance + pos.profit,
        equity: prev.equity,
        profit: prev.profit - pos.profit,
      }));
      addLog("success", `Closed position #${pos.ticket} with P/L: $${pos.profit.toFixed(2)}`);
    }
  }, [positions]);

  const closeAllPositions = useCallback(() => {
    const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
    setAccount((prev) => ({
      ...prev,
      balance: prev.balance + totalProfit,
      profit: 0,
    }));
    setPositions([]);
    addLog("warning", `Force-closed all positions. Total P/L: $${totalProfit.toFixed(2)}`);
  }, [positions]);

  return {
    connectionStatus,
    candles,
    positions,
    orders,
    account,
    strategies,
    riskSettings,
    isTrading,
    selectedSymbol,
    logs,
    connect,
    disconnect,
    startTrading,
    stopTrading,
    toggleStrategy,
    updateRiskSettings,
    setSelectedSymbol,
    closePosition,
    closeAllPositions,
  };
};
