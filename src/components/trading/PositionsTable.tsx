import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, XCircle } from "lucide-react";
import type { Position } from "@/types/trading";

interface PositionsTableProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
  onCloseAll: () => void;
}

export const PositionsTable = ({ positions, onClosePosition, onCloseAll }: PositionsTableProps) => {
  const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);

  return (
    <div className="trading-panel h-full flex flex-col">
      <div className="trading-panel-header">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Open Positions</h3>
          <Badge variant="secondary" className="font-mono">
            {positions.length}
          </Badge>
        </div>
        {positions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            onClick={onCloseAll}
          >
            <XCircle className="w-4 h-4" />
            Close All
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {positions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No open positions</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 sticky top-0">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Ticket</th>
                <th className="px-4 py-2 font-medium">Symbol</th>
                <th className="px-4 py-2 font-medium">Side</th>
                <th className="px-4 py-2 font-medium text-right">Volume</th>
                <th className="px-4 py-2 font-medium text-right">Open</th>
                <th className="px-4 py-2 font-medium text-right">Current</th>
                <th className="px-4 py-2 font-medium text-right">SL</th>
                <th className="px-4 py-2 font-medium text-right">TP</th>
                <th className="px-4 py-2 font-medium text-right">P/L</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono text-muted-foreground">#{pos.ticket}</td>
                  <td className="px-4 py-3 font-semibold">{pos.symbol}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        pos.side === "buy"
                          ? "border-buy/50 text-buy"
                          : "border-sell/50 text-sell"
                      }
                    >
                      {pos.side.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{pos.volume.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">{pos.openPrice.toFixed(5)}</td>
                  <td className="px-4 py-3 text-right font-mono">{pos.currentPrice.toFixed(5)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sell">{pos.sl.toFixed(5)}</td>
                  <td className="px-4 py-3 text-right font-mono text-buy">{pos.tp.toFixed(5)}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold ${
                      pos.profit >= 0 ? "price-up" : "price-down"
                    }`}
                  >
                    {pos.profit >= 0 ? "+" : ""}${pos.profit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onClosePosition(pos.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-secondary/30">
              <tr>
                <td colSpan={8} className="px-4 py-2 text-right font-medium">
                  Total P/L:
                </td>
                <td
                  className={`px-4 py-2 text-right font-mono font-bold ${
                    totalProfit >= 0 ? "price-up" : "price-down"
                  }`}
                >
                  {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};
