import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface RiskSettings {
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
}

interface SessionFilter {
  enabled: boolean;
  allowLondon: boolean;
  allowNewYork: boolean;
  allowTokyo: boolean;
  allowSydney: boolean;
  blockWeekends: boolean;
  blockNewsEvents: boolean;
}

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
}

interface Position {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  profit: number;
  openTime: number;
}

interface Signal {
  type: "open" | "close" | "modify";
  symbol: string;
  side?: "buy" | "sell";
  slPips?: number;
  tpPips?: number;
}

interface DailyStats {
  tradesOpened: number;
  startBalance: number;
  lowestEquity: number;
  weekStartBalance: number;
}

interface RiskCheckResult {
  approved: boolean;
  reason?: string;
  warnings: string[];
  adjustedLots?: number;
  riskAmount?: number;
  modifications?: {
    autoBreakeven?: boolean;
    trailingStop?: number;
  };
}

// Pip value calculations
const PIP_VALUES: Record<string, number> = {
  'EURUSD': 10, 'GBPUSD': 10, 'AUDUSD': 10, 'NZDUSD': 10,
  'USDJPY': 9.1, 'EURJPY': 9.1, 'GBPJPY': 9.1, 'AUDJPY': 9.1,
  'USDCHF': 10.5, 'EURCHF': 10.5, 'GBPCHF': 10.5,
  'USDCAD': 7.5, 'EURCAD': 7.5, 'GBPCAD': 7.5,
  'XAUUSD': 1, 'XAGUSD': 50, 'BTCUSD': 1, 'ETHUSD': 1,
};

function getPipValue(symbol: string, lotSize: number = 1): number {
  const baseValue = PIP_VALUES[symbol.toUpperCase()] || 10;
  return baseValue * lotSize;
}

function isJPYPair(symbol: string): boolean {
  return symbol.toUpperCase().includes('JPY');
}

// Session checks
function getCurrentSession(): { london: boolean; newYork: boolean; tokyo: boolean; sydney: boolean } {
  const now = new Date();
  const utcHour = now.getUTCHours();
  
  return {
    london: utcHour >= 7 && utcHour < 16,
    newYork: utcHour >= 12 && utcHour < 21,
    tokyo: utcHour >= 0 && utcHour < 9,
    sydney: utcHour >= 21 || utcHour < 6,
  };
}

function isWeekend(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  
  // Friday after 21:00 UTC or Saturday or Sunday before 21:00 UTC
  return (day === 5 && hour >= 21) || day === 6 || (day === 0 && hour < 21);
}

function checkSessionFilter(filter: SessionFilter): { passed: boolean; message?: string } {
  if (!filter.enabled) return { passed: true };
  
  if (filter.blockWeekends && isWeekend()) {
    return { passed: false, message: "Trading blocked: Weekend market closure" };
  }
  
  const session = getCurrentSession();
  const allowedSessions = [];
  
  if (filter.allowLondon && session.london) allowedSessions.push('London');
  if (filter.allowNewYork && session.newYork) allowedSessions.push('New York');
  if (filter.allowTokyo && session.tokyo) allowedSessions.push('Tokyo');
  if (filter.allowSydney && session.sydney) allowedSessions.push('Sydney');
  
  if (allowedSessions.length === 0) {
    return { passed: false, message: "Trading blocked: Outside allowed trading sessions" };
  }
  
  return { passed: true };
}

// Position sizing
function calculatePositionSize(
  equity: number,
  riskPct: number,
  slPips: number,
  symbol: string
): { lots: number; riskAmount: number } {
  const riskAmount = equity * (riskPct / 100);
  const pipValue = getPipValue(symbol, 1);
  const lots = riskAmount / (slPips * pipValue);
  
  // Round to 2 decimal places, minimum 0.01
  const roundedLots = Math.max(0.01, Math.floor(lots * 100) / 100);
  const actualRisk = roundedLots * slPips * pipValue;
  
  return { lots: roundedLots, riskAmount: actualRisk };
}

// Risk checks
function checkMaxConcurrentTrades(positions: Position[], maxConcurrent: number): { passed: boolean; message?: string } {
  if (positions.length >= maxConcurrent) {
    return { passed: false, message: `Max concurrent trades (${maxConcurrent}) reached` };
  }
  return { passed: true };
}

function checkMaxTradesPerDay(dailyStats: DailyStats, maxTrades: number): { passed: boolean; message?: string } {
  if (dailyStats.tradesOpened >= maxTrades) {
    return { passed: false, message: `Max daily trades (${maxTrades}) reached` };
  }
  return { passed: true };
}

function checkDailyDrawdown(
  account: AccountInfo,
  dailyStats: DailyStats,
  maxDrawdownPct: number
): { passed: boolean; message?: string; warning?: string } {
  const drawdown = ((dailyStats.startBalance - account.equity) / dailyStats.startBalance) * 100;
  
  if (drawdown >= maxDrawdownPct) {
    return { passed: false, message: `Daily drawdown limit (${maxDrawdownPct}%) exceeded: ${drawdown.toFixed(2)}%` };
  }
  
  if (drawdown >= maxDrawdownPct * 0.8) {
    return { passed: true, warning: `Approaching daily drawdown limit: ${drawdown.toFixed(2)}%` };
  }
  
  return { passed: true };
}

function checkWeeklyDrawdown(
  account: AccountInfo,
  dailyStats: DailyStats,
  maxDrawdownPct: number
): { passed: boolean; message?: string; warning?: string } {
  const drawdown = ((dailyStats.weekStartBalance - account.equity) / dailyStats.weekStartBalance) * 100;
  
  if (drawdown >= maxDrawdownPct) {
    return { passed: false, message: `Weekly drawdown limit (${maxDrawdownPct}%) exceeded: ${drawdown.toFixed(2)}%` };
  }
  
  if (drawdown >= maxDrawdownPct * 0.8) {
    return { passed: true, warning: `Approaching weekly drawdown limit: ${drawdown.toFixed(2)}%` };
  }
  
  return { passed: true };
}

function checkSpreadFilter(currentSpread: number, maxSpreadPips: number): { passed: boolean; message?: string } {
  if (currentSpread > maxSpreadPips) {
    return { passed: false, message: `Spread (${currentSpread} pips) exceeds max (${maxSpreadPips} pips)` };
  }
  return { passed: true };
}

function checkHardStopLoss(signal: Signal, settings: RiskSettings): { passed: boolean; message?: string } {
  if (settings.hardStopLoss && signal.type === 'open' && !signal.slPips) {
    return { passed: false, message: "Hard stop-loss required but not provided" };
  }
  return { passed: true };
}

function checkDuplicatePosition(positions: Position[], symbol: string, side: 'buy' | 'sell'): { passed: boolean; message?: string } {
  const exists = positions.some(p => p.symbol === symbol && p.side === side);
  if (exists) {
    return { passed: false, message: `Duplicate ${side} position on ${symbol} already exists` };
  }
  return { passed: true };
}

function checkMarginAvailable(freeMargin: number, requiredMargin: number): { passed: boolean; message?: string } {
  const buffer = requiredMargin * 1.2; // 20% buffer
  if (freeMargin < buffer) {
    return { passed: false, message: `Insufficient margin. Required: ${buffer.toFixed(2)}, Available: ${freeMargin.toFixed(2)}` };
  }
  return { passed: true };
}

// Main risk evaluation
function evaluateRisk(
  signal: Signal,
  account: AccountInfo,
  positions: Position[],
  settings: RiskSettings,
  dailyStats: DailyStats,
  currentPrice: number,
  currentSpread: number
): RiskCheckResult {
  const warnings: string[] = [];
  
  // Only check for open signals
  if (signal.type !== 'open') {
    return { approved: true, warnings: [] };
  }
  
  // Session filter
  const sessionCheck = checkSessionFilter(settings.sessionFilter);
  if (!sessionCheck.passed) {
    return { approved: false, reason: sessionCheck.message, warnings };
  }
  
  // Hard stop-loss check
  const slCheck = checkHardStopLoss(signal, settings);
  if (!slCheck.passed) {
    return { approved: false, reason: slCheck.message, warnings };
  }
  
  // Max concurrent trades
  const concurrentCheck = checkMaxConcurrentTrades(positions, settings.maxConcurrentTrades);
  if (!concurrentCheck.passed) {
    return { approved: false, reason: concurrentCheck.message, warnings };
  }
  
  // Max trades per day
  const dailyTradesCheck = checkMaxTradesPerDay(dailyStats, settings.maxTradesPerDay);
  if (!dailyTradesCheck.passed) {
    return { approved: false, reason: dailyTradesCheck.message, warnings };
  }
  
  // Daily drawdown
  const dailyDDCheck = checkDailyDrawdown(account, dailyStats, settings.maxDailyDrawdownPct);
  if (!dailyDDCheck.passed) {
    return { approved: false, reason: dailyDDCheck.message, warnings };
  }
  if (dailyDDCheck.warning) warnings.push(dailyDDCheck.warning);
  
  // Weekly drawdown
  const weeklyDDCheck = checkWeeklyDrawdown(account, dailyStats, settings.maxWeeklyDrawdownPct);
  if (!weeklyDDCheck.passed) {
    return { approved: false, reason: weeklyDDCheck.message, warnings };
  }
  if (weeklyDDCheck.warning) warnings.push(weeklyDDCheck.warning);
  
  // Spread filter
  const spreadCheck = checkSpreadFilter(currentSpread, settings.spreadFilterPips);
  if (!spreadCheck.passed) {
    return { approved: false, reason: spreadCheck.message, warnings };
  }
  
  // Duplicate position check
  if (signal.side) {
    const dupCheck = checkDuplicatePosition(positions, signal.symbol, signal.side);
    if (!dupCheck.passed) {
      return { approved: false, reason: dupCheck.message, warnings };
    }
  }
  
  // Calculate position size
  const slPips = signal.slPips || 20; // Default 20 pips if not specified
  const { lots, riskAmount } = calculatePositionSize(
    account.equity,
    settings.defaultRiskPct,
    slPips,
    signal.symbol
  );
  
  // Estimate required margin (rough calculation)
  const estimatedMargin = lots * currentPrice * 100000 / 100; // Assuming 1:100 leverage
  const marginCheck = checkMarginAvailable(account.freeMargin, estimatedMargin);
  if (!marginCheck.passed) {
    return { approved: false, reason: marginCheck.message, warnings };
  }
  
  // Build modifications for auto-features
  const modifications: RiskCheckResult['modifications'] = {};
  if (settings.autoBreakeven) {
    modifications.autoBreakeven = true;
  }
  if (settings.trailingStop) {
    modifications.trailingStop = settings.trailingStopPips;
  }
  
  return {
    approved: true,
    warnings,
    adjustedLots: lots,
    riskAmount,
    modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signal, account, positions, settings, dailyStats, currentPrice, currentSpread } = await req.json();
    
    console.log('Risk Engine v2 evaluating:', { signal, account: { equity: account?.equity } });
    
    const result = evaluateRisk(
      signal,
      account,
      positions || [],
      settings,
      dailyStats,
      currentPrice,
      currentSpread
    );
    
    console.log('Risk evaluation result:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Risk Engine v2 error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      approved: false,
      reason: 'Risk engine error',
      warnings: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
