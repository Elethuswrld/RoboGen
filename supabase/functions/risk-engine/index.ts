import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ Types ============
interface RiskSettings {
  maxDailyDrawdownPct: number;
  defaultRiskPct: number;
  maxConcurrentTrades: number;
  spreadFilterPips: number;
  newsFilterMinutes: number;
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
  ticket: number;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
}

interface Signal {
  type: 'open' | 'close' | 'hold';
  side?: 'buy' | 'sell';
  symbol: string;
  reason: string;
  confidence: number;
  slPips?: number;
  tpPips?: number;
}

interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  slPrice: number;
  tpPrice: number;
  slPips: number;
  tpPips: number;
  riskAmount: number;
  reason: string;
}

interface RiskCheckResult {
  approved: boolean;
  order?: OrderRequest;
  rejectionReason?: string;
  warnings: string[];
}

// ============ Pip Value Calculations ============
const PIP_VALUES: Record<string, number> = {
  'EURUSD': 10,
  'GBPUSD': 10,
  'AUDUSD': 10,
  'NZDUSD': 10,
  'USDCAD': 10,
  'USDCHF': 10,
  'USDJPY': 1000 / 100, // JPY pairs have different pip calculation
  'EURJPY': 1000 / 100,
  'GBPJPY': 1000 / 100,
  'XAUUSD': 1, // Gold: 1 pip = $0.01 per 0.01 lot
  'XAGUSD': 0.5,
};

function getPipValue(symbol: string, lotSize: number = 1): number {
  const baseValue = PIP_VALUES[symbol] || 10;
  return baseValue * lotSize;
}

function isJPYPair(symbol: string): boolean {
  return symbol.includes('JPY');
}

function pipToPrice(symbol: string, pips: number, currentPrice: number): number {
  if (isJPYPair(symbol)) {
    return pips * 0.01;
  }
  if (symbol.includes('XAU')) {
    return pips * 0.1;
  }
  return pips * 0.0001;
}

// ============ Position Sizing ============
function calculatePositionSize(
  equity: number,
  riskPct: number,
  slPips: number,
  symbol: string
): { lots: number; riskAmount: number } {
  // Risk amount in account currency
  const riskAmount = equity * (riskPct / 100);
  
  // Pip value for 1 standard lot
  const pipValuePerLot = getPipValue(symbol, 1);
  
  // Calculate lot size: lots = riskAmount / (slPips * pipValuePerLot)
  let lots = riskAmount / (slPips * pipValuePerLot);
  
  // Round to nearest 0.01 (micro lot) and enforce min/max
  lots = Math.max(0.01, Math.min(lots, 100));
  lots = Math.round(lots * 100) / 100;
  
  return { lots, riskAmount: lots * slPips * pipValuePerLot };
}

// ============ Risk Checks ============
function checkMaxConcurrentTrades(
  positions: Position[],
  maxConcurrent: number
): { passed: boolean; message?: string } {
  if (positions.length >= maxConcurrent) {
    return {
      passed: false,
      message: `Max concurrent trades reached (${positions.length}/${maxConcurrent})`
    };
  }
  return { passed: true };
}

function checkDailyDrawdown(
  balance: number,
  equity: number,
  maxDrawdownPct: number,
  dailyStartBalance: number
): { passed: boolean; message?: string; warning?: string } {
  const currentDrawdownPct = ((dailyStartBalance - equity) / dailyStartBalance) * 100;
  
  if (currentDrawdownPct >= maxDrawdownPct) {
    return {
      passed: false,
      message: `Daily drawdown limit reached (${currentDrawdownPct.toFixed(2)}% >= ${maxDrawdownPct}%)`
    };
  }
  
  // Warning if approaching limit
  if (currentDrawdownPct >= maxDrawdownPct * 0.7) {
    return {
      passed: true,
      warning: `Approaching daily drawdown limit (${currentDrawdownPct.toFixed(2)}% of ${maxDrawdownPct}%)`
    };
  }
  
  return { passed: true };
}

function checkSpreadFilter(
  currentSpread: number,
  maxSpreadPips: number
): { passed: boolean; message?: string } {
  if (currentSpread > maxSpreadPips) {
    return {
      passed: false,
      message: `Spread too high (${currentSpread.toFixed(1)} > ${maxSpreadPips} pips)`
    };
  }
  return { passed: true };
}

function checkDuplicatePosition(
  positions: Position[],
  symbol: string,
  side: 'buy' | 'sell'
): { passed: boolean; message?: string } {
  const existingPosition = positions.find(
    p => p.symbol === symbol && p.side === side
  );
  
  if (existingPosition) {
    return {
      passed: false,
      message: `Already have ${side} position on ${symbol}`
    };
  }
  return { passed: true };
}

function checkMarginAvailable(
  freeMargin: number,
  requiredMargin: number
): { passed: boolean; message?: string } {
  if (freeMargin < requiredMargin * 1.5) { // 50% buffer
    return {
      passed: false,
      message: `Insufficient margin (${freeMargin.toFixed(2)} < ${(requiredMargin * 1.5).toFixed(2)} required)`
    };
  }
  return { passed: true };
}

// ============ Main Risk Engine ============
function evaluateRisk(
  signal: Signal,
  account: AccountInfo,
  positions: Position[],
  settings: RiskSettings,
  currentPrice: number,
  currentSpread: number,
  dailyStartBalance: number
): RiskCheckResult {
  const warnings: string[] = [];
  
  // Skip non-open signals
  if (signal.type !== 'open' || !signal.side) {
    return { approved: false, rejectionReason: 'Signal is not an open order', warnings };
  }
  
  // 1. Check max concurrent trades
  const concurrentCheck = checkMaxConcurrentTrades(positions, settings.maxConcurrentTrades);
  if (!concurrentCheck.passed) {
    return { approved: false, rejectionReason: concurrentCheck.message, warnings };
  }
  
  // 2. Check daily drawdown
  const drawdownCheck = checkDailyDrawdown(
    account.balance,
    account.equity,
    settings.maxDailyDrawdownPct,
    dailyStartBalance
  );
  if (!drawdownCheck.passed) {
    return { approved: false, rejectionReason: drawdownCheck.message, warnings };
  }
  if (drawdownCheck.warning) {
    warnings.push(drawdownCheck.warning);
  }
  
  // 3. Check spread
  const spreadCheck = checkSpreadFilter(currentSpread, settings.spreadFilterPips);
  if (!spreadCheck.passed) {
    return { approved: false, rejectionReason: spreadCheck.message, warnings };
  }
  
  // 4. Check duplicate position
  const duplicateCheck = checkDuplicatePosition(positions, signal.symbol, signal.side);
  if (!duplicateCheck.passed) {
    return { approved: false, rejectionReason: duplicateCheck.message, warnings };
  }
  
  // 5. Calculate position size
  const slPips = signal.slPips || 30;
  const tpPips = signal.tpPips || 60;
  const { lots, riskAmount } = calculatePositionSize(
    account.equity,
    settings.defaultRiskPct,
    slPips,
    signal.symbol
  );
  
  // 6. Estimate required margin (rough approximation)
  const estimatedMargin = lots * currentPrice * 1000 / 30; // ~30:1 leverage estimate
  const marginCheck = checkMarginAvailable(account.freeMargin, estimatedMargin);
  if (!marginCheck.passed) {
    return { approved: false, rejectionReason: marginCheck.message, warnings };
  }
  
  // 7. Calculate SL/TP prices
  const priceOffset = pipToPrice(signal.symbol, slPips, currentPrice);
  const tpOffset = pipToPrice(signal.symbol, tpPips, currentPrice);
  
  let slPrice: number;
  let tpPrice: number;
  
  if (signal.side === 'buy') {
    slPrice = currentPrice - priceOffset;
    tpPrice = currentPrice + tpOffset;
  } else {
    slPrice = currentPrice + priceOffset;
    tpPrice = currentPrice - tpOffset;
  }
  
  // 8. Validate risk/reward ratio
  if (tpPips < slPips) {
    warnings.push(`Warning: Risk/Reward ratio is less than 1:1 (${(tpPips/slPips).toFixed(2)})`);
  }
  
  // All checks passed - create order request
  const order: OrderRequest = {
    symbol: signal.symbol,
    side: signal.side,
    volume: lots,
    slPrice: Math.round(slPrice * 100000) / 100000,
    tpPrice: Math.round(tpPrice * 100000) / 100000,
    slPips,
    tpPips,
    riskAmount: Math.round(riskAmount * 100) / 100,
    reason: signal.reason
  };
  
  console.log(`Risk approved: ${order.side} ${order.symbol} @ ${lots} lots, SL: ${slPrice.toFixed(5)}, TP: ${tpPrice.toFixed(5)}`);
  
  return { approved: true, order, warnings };
}

// ============ HTTP Handler ============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      signal, 
      account, 
      positions, 
      settings, 
      currentPrice, 
      currentSpread,
      dailyStartBalance 
    } = await req.json();
    
    console.log(`Risk Engine: Evaluating ${signal?.side} ${signal?.symbol} signal`);
    
    // Validate required fields
    if (!signal || !account || !settings) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: signal, account, settings' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const result = evaluateRisk(
      signal,
      account,
      positions || [],
      settings,
      currentPrice || 1.0,
      currentSpread || 1.0,
      dailyStartBalance || account.balance
    );
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Risk Engine error:', error);
    return new Response(JSON.stringify({ 
      approved: false,
      rejectionReason: error instanceof Error ? error.message : 'Unknown error',
      warnings: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
