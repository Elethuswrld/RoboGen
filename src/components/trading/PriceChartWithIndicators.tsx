import { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Candle } from "@/types/trading";

interface PriceChartProps {
  candles: Candle[];
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY"];
const timeframes = ["M1", "M5", "M15", "H1", "H4", "D1"];

// Calculate Simple Moving Average
const calculateSMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

// Calculate RSI
const calculateRSI = (closes: number[], period: number = 14): (number | null)[] => {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
      continue;
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  return result;
};

// Calculate Bollinger Bands
const calculateBollingerBands = (data: number[], period: number = 20, stdDev: number = 2) => {
  const sma = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(Math.max(0, i - period + 1), i + 1);
      const mean = sma[i]!;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / slice.length;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { sma, upper, lower };
};

export const PriceChartWithIndicators = ({ candles, selectedSymbol, onSymbolChange }: PriceChartProps) => {
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(false);

  const chartData = useMemo(() => {
    const sliced = candles.slice(-100);
    const closes = sliced.map(c => c.close);
    const ma20 = calculateSMA(closes, 20);
    const ma50 = calculateSMA(closes, 50);
    const bb = calculateBollingerBands(closes, 20, 2);
    const rsi = calculateRSI(closes, 14);

    return sliced.map((candle, i) => ({
      time: new Date(candle.time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      color: candle.close >= candle.open ? "hsl(var(--buy))" : "hsl(var(--sell))",
      body: Math.abs(candle.close - candle.open),
      bodyBase: Math.min(candle.open, candle.close),
      wick: candle.high - candle.low,
      wickBase: candle.low,
      ma20: ma20[i],
      ma50: ma50[i],
      bbUpper: bb.upper[i],
      bbMiddle: bb.sma[i],
      bbLower: bb.lower[i],
      rsi: rsi[i],
    }));
  }, [candles]);

  const currentPrice = candles[candles.length - 1]?.close || 0;
  const previousPrice = candles[candles.length - 2]?.close || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  const isUp = priceChange >= 0;

  const priceDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 0];
    const values = chartData.flatMap((d) => [
      d.high,
      d.low,
      showBB ? d.bbUpper : null,
      showBB ? d.bbLower : null,
    ]).filter((v): v is number => v !== null);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [chartData, showBB]);

  return (
    <div className="trading-panel h-full flex flex-col">
      <div className="trading-panel-header flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Select value={selectedSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="w-32 bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select defaultValue="M5">
            <SelectTrigger className="w-20 bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((tf) => (
                <SelectItem key={tf} value={tf}>{tf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Switch id="ma20" checked={showMA20} onCheckedChange={setShowMA20} className="scale-75" />
              <Label htmlFor="ma20" className="text-xs text-blue-400">MA20</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch id="ma50" checked={showMA50} onCheckedChange={setShowMA50} className="scale-75" />
              <Label htmlFor="ma50" className="text-xs text-yellow-400">MA50</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch id="bb" checked={showBB} onCheckedChange={setShowBB} className="scale-75" />
              <Label htmlFor="bb" className="text-xs text-purple-400">BB</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch id="rsi" checked={showRSI} onCheckedChange={setShowRSI} className="scale-75" />
              <Label htmlFor="rsi" className="text-xs text-orange-400">RSI</Label>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono">
              {currentPrice.toFixed(selectedSymbol.includes("JPY") ? 3 : selectedSymbol.includes("XAU") ? 2 : 5)}
            </p>
            <p className={`text-sm font-mono ${isUp ? "price-up" : "price-down"}`}>
              {isUp ? "+" : ""}{priceChange.toFixed(5)} ({isUp ? "+" : ""}{priceChangePercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>

      <div className={`flex-1 p-4 min-h-0 ${showRSI ? "pb-0" : ""}`}>
        <ResponsiveContainer width="100%" height={showRSI ? "70%" : "100%"}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={priceDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }}
              orientation="right"
              tickFormatter={(v) => v.toFixed(selectedSymbol.includes("XAU") ? 0 : 4)}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 15%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(210, 20%, 92%)" }}
            />
            <ReferenceLine y={currentPrice} stroke="hsl(210, 100%, 50%)" strokeDasharray="3 3" strokeOpacity={0.5} />
            
            {/* Bollinger Bands */}
            {showBB && (
              <>
                <Area type="monotone" dataKey="bbUpper" stroke="none" fill="hsl(280, 70%, 50%)" fillOpacity={0.1} />
                <Line type="monotone" dataKey="bbUpper" stroke="hsl(280, 70%, 50%)" strokeWidth={1} dot={false} strokeOpacity={0.6} />
                <Line type="monotone" dataKey="bbMiddle" stroke="hsl(280, 70%, 50%)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="bbLower" stroke="hsl(280, 70%, 50%)" strokeWidth={1} dot={false} strokeOpacity={0.6} />
              </>
            )}

            {/* Moving Averages */}
            {showMA20 && <Line type="monotone" dataKey="ma20" stroke="hsl(210, 100%, 60%)" strokeWidth={1.5} dot={false} />}
            {showMA50 && <Line type="monotone" dataKey="ma50" stroke="hsl(45, 100%, 50%)" strokeWidth={1.5} dot={false} />}

            {/* Candlesticks */}
            <Bar dataKey="wick" stackId="candle" fill="transparent" stroke="hsl(215, 15%, 40%)" strokeWidth={1} />
            <Bar
              dataKey="body"
              stackId="body"
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                return <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={payload.color} rx={1} />;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* RSI Panel */}
        {showRSI && (
          <ResponsiveContainer width="100%" height="28%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <XAxis dataKey="time" hide />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }}
                orientation="right"
                ticks={[30, 50, 70]}
                width={70}
              />
              <ReferenceLine y={70} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={30} stroke="hsl(142, 70%, 45%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="rsi" stroke="hsl(30, 100%, 50%)" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
