import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ Strategy Types ============
interface Candle {
  symbol?: string;
  timeframe?: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Signal {
  type: 'open' | 'close' | 'hold';
  side?: 'buy' | 'sell';
  symbol: string;
  reason: string;
  confidence: number;
  slPips?: number;
  tpPips?: number;
  timestamp: number;
}

interface StrategyParams {
  [key: string]: number | string | boolean;
}

interface StrategyConfig {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  enabled: boolean;
  params: StrategyParams;
}

// ============ Indicator Calculations ============
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
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
      const sum = prices.slice(0, i + 1).reduce((a, b) => a + b, 0);
      ema.push(sum / (i + 1));
    } else if (i === period - 1) {
      const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
      ema.push(sum / period);
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
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(NaN);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
  }
  return rsi;
}

function calculateATR(candles: Candle[], period: number = 14): number[] {
  const tr: number[] = [];
  const atr: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }
  
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      atr.push(NaN);
    } else if (i === period - 1) {
      atr.push(tr.slice(0, period).reduce((a, b) => a + b, 0) / period);
    } else {
      atr.push((atr[i - 1] * (period - 1) + tr[i]) / period);
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
      const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }
  
  return { sma, upper, lower };
}

// ============ Strategy Implementations ============
function maCrossStrategy(candles: Candle[], params: StrategyParams): Signal | null {
  const closes = candles.map(c => c.close);
  const fastPeriod = Number(params.fast) || 9;
  const slowPeriod = Number(params.slow) || 21;
  
  if (candles.length < slowPeriod + 2) return null;
  
  const fastMA = calculateEMA(closes, fastPeriod);
  const slowMA = calculateEMA(closes, slowPeriod);
  
  const lastIdx = closes.length - 1;
  const prevIdx = lastIdx - 1;
  
  const fastCurrent = fastMA[lastIdx];
  const slowCurrent = slowMA[lastIdx];
  const fastPrev = fastMA[prevIdx];
  const slowPrev = slowMA[prevIdx];
  
  if (isNaN(fastCurrent) || isNaN(slowCurrent) || isNaN(fastPrev) || isNaN(slowPrev)) {
    return null;
  }
  
  // Bullish crossover
  if (fastPrev <= slowPrev && fastCurrent > slowCurrent) {
    return {
      type: 'open',
      side: 'buy',
      symbol: candles[0].symbol || '',
      reason: `MA Cross BUY: Fast EMA(${fastPeriod}) crossed above Slow EMA(${slowPeriod})`,
      confidence: 0.7,
      slPips: 30,
      tpPips: 60,
      timestamp: Date.now()
    };
  }
  
  // Bearish crossover
  if (fastPrev >= slowPrev && fastCurrent < slowCurrent) {
    return {
      type: 'open',
      side: 'sell',
      symbol: candles[0].symbol || '',
      reason: `MA Cross SELL: Fast EMA(${fastPeriod}) crossed below Slow EMA(${slowPeriod})`,
      confidence: 0.7,
      slPips: 30,
      tpPips: 60,
      timestamp: Date.now()
    };
  }
  
  return null;
}

function rsiBandsStrategy(candles: Candle[], params: StrategyParams): Signal | null {
  const closes = candles.map(c => c.close);
  const period = Number(params.period) || 14;
  const overbought = Number(params.overbought) || 70;
  const oversold = Number(params.oversold) || 30;
  
  if (candles.length < period + 2) return null;
  
  const rsi = calculateRSI(closes, period);
  const lastIdx = closes.length - 1;
  const prevIdx = lastIdx - 1;
  
  const rsiCurrent = rsi[lastIdx];
  const rsiPrev = rsi[prevIdx];
  
  if (isNaN(rsiCurrent) || isNaN(rsiPrev)) return null;
  
  // Oversold bounce (buy signal)
  if (rsiPrev < oversold && rsiCurrent >= oversold) {
    return {
      type: 'open',
      side: 'buy',
      symbol: candles[0].symbol || '',
      reason: `RSI BUY: RSI(${period}) crossed above oversold level ${oversold}`,
      confidence: 0.65,
      slPips: 25,
      tpPips: 50,
      timestamp: Date.now()
    };
  }
  
  // Overbought reversal (sell signal)
  if (rsiPrev > overbought && rsiCurrent <= overbought) {
    return {
      type: 'open',
      side: 'sell',
      symbol: candles[0].symbol || '',
      reason: `RSI SELL: RSI(${period}) crossed below overbought level ${overbought}`,
      confidence: 0.65,
      slPips: 25,
      tpPips: 50,
      timestamp: Date.now()
    };
  }
  
  return null;
}

function scalperStrategy(candles: Candle[], params: StrategyParams): Signal | null {
  const closes = candles.map(c => c.close);
  const atrPeriod = Number(params.atrPeriod) || 14;
  const multiplier = Number(params.multiplier) || 1.5;
  
  if (candles.length < atrPeriod + 5) return null;
  
  const atr = calculateATR(candles, atrPeriod);
  const bb = calculateBollingerBands(closes, 20, 2);
  
  const lastIdx = closes.length - 1;
  const currentPrice = closes[lastIdx];
  const currentATR = atr[lastIdx];
  const upperBand = bb.upper[lastIdx];
  const lowerBand = bb.lower[lastIdx];
  const middleBand = bb.sma[lastIdx];
  
  if (isNaN(currentATR) || isNaN(upperBand) || isNaN(lowerBand)) return null;
  
  // Calculate dynamic SL/TP based on ATR
  const slPips = Math.round(currentATR * multiplier * 10000);
  const tpPips = Math.round(currentATR * multiplier * 2 * 10000);
  
  // Price touches lower band - potential buy
  if (currentPrice <= lowerBand) {
    return {
      type: 'open',
      side: 'buy',
      symbol: candles[0].symbol || '',
      reason: `Scalper BUY: Price touched lower Bollinger Band`,
      confidence: 0.6,
      slPips: Math.max(slPips, 10),
      tpPips: Math.max(tpPips, 20),
      timestamp: Date.now()
    };
  }
  
  // Price touches upper band - potential sell
  if (currentPrice >= upperBand) {
    return {
      type: 'open',
      side: 'sell',
      symbol: candles[0].symbol || '',
      reason: `Scalper SELL: Price touched upper Bollinger Band`,
      confidence: 0.6,
      slPips: Math.max(slPips, 10),
      tpPips: Math.max(tpPips, 20),
      timestamp: Date.now()
    };
  }
  
  return null;
}

// ============ Strategy Router ============
function evaluateStrategy(strategy: StrategyConfig, candles: Candle[]): Signal | null {
  if (!strategy.enabled) return null;
  
  switch (strategy.name) {
    case 'MA Cross':
      return maCrossStrategy(candles, strategy.params);
    case 'RSI Bands':
      return rsiBandsStrategy(candles, strategy.params);
    case 'Scalper':
      return scalperStrategy(candles, strategy.params);
    default:
      console.log(`Unknown strategy: ${strategy.name}`);
      return null;
  }
}

// ============ HTTP Handler ============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { strategies, candles, symbol, timeframe } = await req.json();
    
    console.log(`Strategy Engine: Evaluating ${strategies?.length || 0} strategies for ${symbol} ${timeframe}`);
    
    if (!strategies || !candles || !Array.isArray(strategies) || !Array.isArray(candles)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request: strategies and candles arrays required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const signals: Signal[] = [];
    
    for (const strategy of strategies) {
      // Only evaluate if strategy matches the symbol/timeframe
      if (strategy.symbol === symbol && strategy.timeframe === timeframe && strategy.enabled) {
        const signal = evaluateStrategy(strategy, candles);
        if (signal) {
          signal.symbol = symbol;
          signals.push(signal);
          console.log(`Signal generated: ${signal.side} ${symbol} - ${signal.reason}`);
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      signals,
      evaluated: strategies.filter((s: StrategyConfig) => s.enabled).length,
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Strategy Engine error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
