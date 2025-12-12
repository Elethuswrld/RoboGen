import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestConfig {
  strategyId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  spread: number;
  slippage: number;
  params: Record<string, number | string | boolean>;
}

interface BacktestTrade {
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
}

interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  largestWin: number;
  largestLoss: number;
  avgTradeDuration: number;
  equityCurve: { time: number; equity: number }[];
  trades: BacktestTrade[];
}

interface SimulatedPosition {
  side: "buy" | "sell";
  entryPrice: number;
  entryTime: number;
  volume: number;
  sl: number;
  tp: number;
}

// Technical Indicators
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      sma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return sma;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      ema.push(prices[i]);
    } else if (i < period - 1) {
      ema.push((prices[i] + ema[i - 1] * (i)) / (i + 1));
    } else {
      ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      rsi.push(NaN);
      continue;
    }

    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);

    if (i < period) {
      rsi.push(NaN);
      continue;
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  return rsi;
}

function calculateATR(candles: Candle[], period: number = 14): number[] {
  const atr: number[] = [];
  const tr: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
      atr.push(NaN);
      continue;
    }

    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trueRange);

    if (i < period - 1) {
      atr.push(NaN);
    } else if (i === period - 1) {
      atr.push(tr.slice(0, period).reduce((a, b) => a + b, 0) / period);
    } else {
      atr.push((atr[i - 1] * (period - 1) + trueRange) / period);
    }
  }
  return atr;
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { middle: sma, upper, lower };
}

// Strategy implementations
function maCrossStrategy(
  candles: Candle[],
  params: Record<string, number | string | boolean>,
  position: SimulatedPosition | null
): { action: 'buy' | 'sell' | 'close' | null; sl?: number; tp?: number } {
  const fastPeriod = Number(params.fastPeriod) || 10;
  const slowPeriod = Number(params.slowPeriod) || 20;
  const atrMultiplier = Number(params.atrMultiplier) || 1.5;

  const closes = candles.map(c => c.close);
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const atr = calculateATR(candles, 14);

  const i = candles.length - 1;
  if (i < slowPeriod + 1) return { action: null };

  const fastNow = fastEMA[i];
  const fastPrev = fastEMA[i - 1];
  const slowNow = slowEMA[i];
  const slowPrev = slowEMA[i - 1];
  const currentATR = atr[i] || 0.001;
  const currentPrice = candles[i].close;

  // Buy signal: fast crosses above slow
  if (fastPrev <= slowPrev && fastNow > slowNow && !position) {
    return {
      action: 'buy',
      sl: currentPrice - currentATR * atrMultiplier,
      tp: currentPrice + currentATR * atrMultiplier * 2,
    };
  }

  // Sell signal: fast crosses below slow
  if (fastPrev >= slowPrev && fastNow < slowNow && !position) {
    return {
      action: 'sell',
      sl: currentPrice + currentATR * atrMultiplier,
      tp: currentPrice - currentATR * atrMultiplier * 2,
    };
  }

  // Close conditions
  if (position) {
    if (position.side === 'buy' && fastNow < slowNow) {
      return { action: 'close' };
    }
    if (position.side === 'sell' && fastNow > slowNow) {
      return { action: 'close' };
    }
  }

  return { action: null };
}

function rsiBandsStrategy(
  candles: Candle[],
  params: Record<string, number | string | boolean>,
  position: SimulatedPosition | null
): { action: 'buy' | 'sell' | 'close' | null; sl?: number; tp?: number } {
  const rsiPeriod = Number(params.rsiPeriod) || 14;
  const oversold = Number(params.oversold) || 30;
  const overbought = Number(params.overbought) || 70;
  const atrMultiplier = Number(params.atrMultiplier) || 1.5;

  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, rsiPeriod);
  const atr = calculateATR(candles, 14);

  const i = candles.length - 1;
  if (i < rsiPeriod + 1) return { action: null };

  const rsiNow = rsi[i];
  const rsiPrev = rsi[i - 1];
  const currentATR = atr[i] || 0.001;
  const currentPrice = candles[i].close;

  // Buy signal: RSI crosses above oversold
  if (rsiPrev < oversold && rsiNow >= oversold && !position) {
    return {
      action: 'buy',
      sl: currentPrice - currentATR * atrMultiplier,
      tp: currentPrice + currentATR * atrMultiplier * 2,
    };
  }

  // Sell signal: RSI crosses below overbought
  if (rsiPrev > overbought && rsiNow <= overbought && !position) {
    return {
      action: 'sell',
      sl: currentPrice + currentATR * atrMultiplier,
      tp: currentPrice - currentATR * atrMultiplier * 2,
    };
  }

  // Close conditions
  if (position) {
    if (position.side === 'buy' && rsiNow >= overbought) {
      return { action: 'close' };
    }
    if (position.side === 'sell' && rsiNow <= oversold) {
      return { action: 'close' };
    }
  }

  return { action: null };
}

function scalperStrategy(
  candles: Candle[],
  params: Record<string, number | string | boolean>,
  position: SimulatedPosition | null
): { action: 'buy' | 'sell' | 'close' | null; sl?: number; tp?: number } {
  const bbPeriod = Number(params.bbPeriod) || 20;
  const bbStdDev = Number(params.bbStdDev) || 2;
  const atrPeriod = Number(params.atrPeriod) || 14;

  const closes = candles.map(c => c.close);
  const bb = calculateBollingerBands(closes, bbPeriod, bbStdDev);
  const atr = calculateATR(candles, atrPeriod);

  const i = candles.length - 1;
  if (i < bbPeriod + 1) return { action: null };

  const currentPrice = candles[i].close;
  const prevPrice = candles[i - 1].close;
  const upperBand = bb.upper[i];
  const lowerBand = bb.lower[i];
  const prevLower = bb.lower[i - 1];
  const prevUpper = bb.upper[i - 1];
  const currentATR = atr[i] || 0.001;

  // Buy signal: price bounces off lower band
  if (prevPrice <= prevLower && currentPrice > lowerBand && !position) {
    return {
      action: 'buy',
      sl: currentPrice - currentATR * 1.5,
      tp: bb.middle[i],
    };
  }

  // Sell signal: price bounces off upper band
  if (prevPrice >= prevUpper && currentPrice < upperBand && !position) {
    return {
      action: 'sell',
      sl: currentPrice + currentATR * 1.5,
      tp: bb.middle[i],
    };
  }

  return { action: null };
}

// Execute strategy
function executeStrategy(
  strategyId: string,
  candles: Candle[],
  params: Record<string, number | string | boolean>,
  position: SimulatedPosition | null
): { action: 'buy' | 'sell' | 'close' | null; sl?: number; tp?: number } {
  switch (strategyId) {
    case 'ma-cross':
    case 'MA Cross':
      return maCrossStrategy(candles, params, position);
    case 'rsi-bands':
    case 'RSI Bands':
      return rsiBandsStrategy(candles, params, position);
    case 'scalper':
    case 'Scalper':
      return scalperStrategy(candles, params, position);
    default:
      return maCrossStrategy(candles, params, position);
  }
}

// Generate sample candles for demo
function generateSampleCandles(startDate: string, endDate: string, timeframe: string): Candle[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  let intervalMs: number;
  switch (timeframe) {
    case 'M1': intervalMs = 60 * 1000; break;
    case 'M5': intervalMs = 5 * 60 * 1000; break;
    case 'M15': intervalMs = 15 * 60 * 1000; break;
    case 'H1': intervalMs = 60 * 60 * 1000; break;
    case 'H4': intervalMs = 4 * 60 * 60 * 1000; break;
    case 'D1': intervalMs = 24 * 60 * 60 * 1000; break;
    default: intervalMs = 60 * 60 * 1000;
  }
  
  const candles: Candle[] = [];
  let price = 1.1000; // Starting price for EURUSD-like pair
  
  for (let time = start; time <= end; time += intervalMs) {
    const volatility = 0.0002 + Math.random() * 0.0008;
    const trend = Math.sin(time / (1000 * 60 * 60 * 24 * 30)) * 0.0001; // Monthly trend
    
    const open = price;
    const change = (Math.random() - 0.5) * volatility + trend;
    const high = Math.max(open, open + change) + Math.random() * volatility * 0.5;
    const low = Math.min(open, open + change) - Math.random() * volatility * 0.5;
    const close = open + change;
    const volume = Math.floor(100 + Math.random() * 500);
    
    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  
  return candles;
}

// Run backtest
function runBacktest(config: BacktestConfig, candles: Candle[]): BacktestResult {
  const trades: BacktestTrade[] = [];
  const equityCurve: { time: number; equity: number }[] = [];
  
  let equity = config.initialBalance;
  let position: SimulatedPosition | null = null;
  let maxEquity = equity;
  let maxDrawdown = 0;
  let tradeIdCounter = 0;
  
  // Process each candle
  for (let i = 50; i < candles.length; i++) {
    const candleSlice = candles.slice(0, i + 1);
    const currentCandle = candles[i];
    
    // Check stop-loss and take-profit
    if (position) {
      let exitPrice: number | null = null;
      let exitReason = '';
      
      if (position.side === 'buy') {
        if (currentCandle.low <= position.sl) {
          exitPrice = position.sl - config.slippage * 0.0001;
          exitReason = 'stop-loss';
        } else if (currentCandle.high >= position.tp) {
          exitPrice = position.tp;
          exitReason = 'take-profit';
        }
      } else {
        if (currentCandle.high >= position.sl) {
          exitPrice = position.sl + config.slippage * 0.0001;
          exitReason = 'stop-loss';
        } else if (currentCandle.low <= position.tp) {
          exitPrice = position.tp;
          exitReason = 'take-profit';
        }
      }
      
      if (exitPrice !== null) {
        const pips = position.side === 'buy'
          ? (exitPrice - position.entryPrice) * 10000
          : (position.entryPrice - exitPrice) * 10000;
        const pnl = pips * position.volume * 10; // Approx $10 per pip per lot
        
        trades.push({
          id: `trade-${++tradeIdCounter}`,
          time: position.entryTime,
          closeTime: currentCandle.time,
          symbol: config.symbol,
          side: position.side,
          entryPrice: position.entryPrice,
          exitPrice,
          volume: position.volume,
          pnl,
          pips,
          strategy: config.strategyId,
        });
        
        equity += pnl;
        position = null;
      }
    }
    
    // Get strategy signal
    const signal = executeStrategy(config.strategyId, candleSlice, config.params, position);
    
    // Execute signal
    if (signal.action === 'buy' && !position) {
      const entryPrice = currentCandle.close + config.spread * 0.0001 + config.slippage * 0.0001;
      position = {
        side: 'buy',
        entryPrice,
        entryTime: currentCandle.time,
        volume: 0.1, // Fixed lot size for backtest
        sl: signal.sl || entryPrice - 0.002,
        tp: signal.tp || entryPrice + 0.004,
      };
    } else if (signal.action === 'sell' && !position) {
      const entryPrice = currentCandle.close - config.spread * 0.0001 - config.slippage * 0.0001;
      position = {
        side: 'sell',
        entryPrice,
        entryTime: currentCandle.time,
        volume: 0.1,
        sl: signal.sl || entryPrice + 0.002,
        tp: signal.tp || entryPrice - 0.004,
      };
    } else if (signal.action === 'close' && position) {
      const exitPrice = currentCandle.close;
      const pips = position.side === 'buy'
        ? (exitPrice - position.entryPrice) * 10000
        : (position.entryPrice - exitPrice) * 10000;
      const pnl = pips * position.volume * 10;
      
      trades.push({
        id: `trade-${++tradeIdCounter}`,
        time: position.entryTime,
        closeTime: currentCandle.time,
        symbol: config.symbol,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice,
        volume: position.volume,
        pnl,
        pips,
        strategy: config.strategyId,
      });
      
      equity += pnl;
      position = null;
    }
    
    // Update equity curve and drawdown
    maxEquity = Math.max(maxEquity, equity);
    const drawdown = (maxEquity - equity) / maxEquity * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    
    // Sample equity curve (every 10 candles to reduce data)
    if (i % 10 === 0) {
      equityCurve.push({ time: currentCandle.time, equity });
    }
  }
  
  // Calculate statistics
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  
  // Calculate Sharpe ratio (simplified)
  const returns = trades.map(t => t.pnl);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 0
    ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  
  // Calculate average trade duration
  const avgDuration = trades.length > 0
    ? trades.reduce((sum, t) => sum + (t.closeTime - t.time), 0) / trades.length / (1000 * 60 * 60)
    : 0; // In hours
  
  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
    totalPnL: equity - config.initialBalance,
    maxDrawdown: maxEquity - (equity - maxDrawdown / 100 * maxEquity),
    maxDrawdownPct: maxDrawdown,
    sharpeRatio,
    avgWin,
    avgLoss,
    avgRR: avgLoss > 0 ? avgWin / avgLoss : 0,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
    avgTradeDuration: avgDuration,
    equityCurve,
    trades,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config, candles: providedCandles } = await req.json();
    
    console.log('Backtesting engine starting:', { 
      strategy: config.strategyId,
      symbol: config.symbol,
      timeframe: config.timeframe,
    });
    
    // Use provided candles or generate sample data
    const candles = providedCandles || generateSampleCandles(
      config.startDate,
      config.endDate,
      config.timeframe
    );
    
    console.log(`Processing ${candles.length} candles`);
    
    const result = runBacktest(config, candles);
    
    console.log('Backtest complete:', {
      totalTrades: result.totalTrades,
      winRate: result.winRate.toFixed(2),
      totalPnL: result.totalPnL.toFixed(2),
    });
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Backtesting engine error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
