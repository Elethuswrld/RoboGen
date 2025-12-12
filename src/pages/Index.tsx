import { useState, useCallback } from "react";
import { Header } from "@/components/trading/Header";
import { AccountStats } from "@/components/trading/AccountStats";
import { PriceChart } from "@/components/trading/PriceChart";
import { PositionsTable } from "@/components/trading/PositionsTable";
import { StrategiesPanel } from "@/components/trading/StrategiesPanel";
import { RiskPanelV2 } from "@/components/trading/RiskPanelV2";
import { LogsPanel } from "@/components/trading/LogsPanel";
import { useMT5Connection } from "@/hooks/useMT5Connection";
import { Strategy, RiskSettings, AccountInfo } from "@/types/trading";

const defaultStrategies: Strategy[] = [
  {
    id: "1",
    name: "MA Cross",
    symbol: "EURUSD",
    timeframe: "M15",
    enabled: true,
    params: { fast: 9, slow: 21 },
  },
  {
    id: "2",
    name: "RSI Bands",
    symbol: "GBPUSD",
    timeframe: "H1",
    enabled: false,
    params: { period: 14, overbought: 70, oversold: 30 },
  },
  {
    id: "3",
    name: "Scalper",
    symbol: "USDJPY",
    timeframe: "M5",
    enabled: false,
    params: { atrPeriod: 14, multiplier: 1.5 },
  },
];

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

const defaultAccount: AccountInfo = {
  balance: 0,
  equity: 0,
  margin: 0,
  freeMargin: 0,
  marginLevel: 0,
  profit: 0,
  currency: "USD",
};

const Index = () => {
  const {
    connectionStatus,
    accountInfo,
    positions,
    candles,
    logs,
    isTrading,
    connect,
    disconnect,
    startTrading,
    stopTrading,
    closePosition,
    sendMessage,
  } = useMT5Connection();

  const [strategies, setStrategies] = useState<Strategy[]>(defaultStrategies);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(defaultRiskSettings);
  const [selectedSymbol, setSelectedSymbol] = useState("EURUSD");

  const toggleStrategy = useCallback((id: string) => {
    setStrategies(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    const strategy = strategies.find(s => s.id === id);
    if (strategy) {
      sendMessage('strategy_update', {
        strategyId: id,
        enabled: !strategy.enabled,
      });
    }
  }, [strategies, sendMessage]);

  const updateRiskSettings = useCallback((updates: Partial<RiskSettings>) => {
    setRiskSettings(prev => {
      const newSettings = { ...prev, ...updates };
      sendMessage('risk_update', newSettings);
      return newSettings;
    });
  }, [sendMessage]);

  const handleClosePosition = useCallback((id: string) => {
    const position = positions.find(p => p.id === id);
    if (position) {
      closePosition(position.ticket);
    }
  }, [positions, closePosition]);

  const handleCloseAll = useCallback(() => {
    positions.forEach(p => closePosition(p.ticket));
  }, [positions, closePosition]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        connectionStatus={connectionStatus}
        isTrading={isTrading}
        onConnect={() => connect()}
        onDisconnect={disconnect}
        onStartTrading={startTrading}
        onStopTrading={stopTrading}
      />

      <main className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col gap-4 max-w-full">
          {/* Row 1: Account Stats */}
          <section className="w-full">
            <AccountStats account={accountInfo || defaultAccount} />
          </section>

          {/* Row 2: Chart + Strategies */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-[400px]">
              <PriceChart
                candles={candles}
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
              />
            </div>
            <div className="h-[400px]">
              <StrategiesPanel
                strategies={strategies}
                onToggleStrategy={toggleStrategy}
                isTrading={isTrading}
              />
            </div>
          </section>

          {/* Row 3: Positions + Risk */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-[300px]">
              <PositionsTable
                positions={positions}
                onClosePosition={handleClosePosition}
                onCloseAll={handleCloseAll}
              />
            </div>
            <div className="h-[300px]">
              <RiskPanelV2 settings={riskSettings} onUpdateSettings={updateRiskSettings} />
            </div>
          </section>

          {/* Row 4: Logs */}
          <section className="h-[200px]">
            <LogsPanel logs={logs} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
