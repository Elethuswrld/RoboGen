import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Candle } from "@/types/trading";

interface PriceChartProps {
  candles: Candle[];
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY"];
const timeframes = ["M1", "M5", "M15", "H1", "H4", "D1"];

export const PriceChart = ({ candles, selectedSymbol, onSymbolChange }: PriceChartProps) => {
  const chartData = useMemo(() => {
    return candles.slice(-50).map((candle) => ({
      time: new Date(candle.time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      color: candle.close >= candle.open ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)",
      body: Math.abs(candle.close - candle.open),
      bodyBase: Math.min(candle.open, candle.close),
      wick: candle.high - candle.low,
      wickBase: candle.low,
    }));
  }, [candles]);

  const currentPrice = candles[candles.length - 1]?.close || 0;
  const previousPrice = candles[candles.length - 2]?.close || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  const isUp = priceChange >= 0;

  const domain = useMemo(() => {
    if (chartData.length === 0) return [0, 0];
    const highs = chartData.map((d) => d.high);
    const lows = chartData.map((d) => d.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [chartData]);

  return (
    <div className="trading-panel h-full flex flex-col">
      <div className="trading-panel-header">
        <div className="flex items-center gap-4">
          <Select value={selectedSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="w-32 bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select defaultValue="M5">
            <SelectTrigger className="w-20 bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
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

      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={domain}
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
              formatter={(value: number, name: string) => [
                value.toFixed(5),
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <ReferenceLine
              y={currentPrice}
              stroke="hsl(210, 100%, 50%)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            {/* Wicks */}
            <Bar
              dataKey="wick"
              stackId="candle"
              fill="transparent"
              stroke="hsl(215, 15%, 40%)"
              strokeWidth={1}
            />
            {/* Body */}
            <Bar
              dataKey="body"
              stackId="body"
              fill="currentColor"
              radius={[2, 2, 0, 0]}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={Math.max(height, 1)}
                    fill={payload.color}
                    rx={1}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
