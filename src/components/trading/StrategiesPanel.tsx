import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, TrendingUp } from "lucide-react";
import type { Strategy } from "@/types/trading";

interface StrategiesPanelProps {
  strategies: Strategy[];
  onToggleStrategy: (id: string) => void;
  isTrading: boolean;
}

export const StrategiesPanel = ({ strategies, onToggleStrategy, isTrading }: StrategiesPanelProps) => {
  const activeCount = strategies.filter((s) => s.enabled).length;

  return (
    <div className="trading-panel h-full flex flex-col">
      <div className="trading-panel-header">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Strategies</h3>
          <Badge variant="secondary" className="font-mono">
            {activeCount}/{strategies.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 rounded-lg border transition-all ${
              strategy.enabled
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-secondary/20"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    strategy.enabled && isTrading
                      ? "bg-primary animate-pulse-glow"
                      : strategy.enabled
                      ? "bg-primary"
                      : "bg-muted-foreground"
                  }`}
                />
                <span className="font-semibold">{strategy.name}</span>
              </div>
              <Switch
                checked={strategy.enabled}
                onCheckedChange={() => onToggleStrategy(strategy.id)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Symbol:</span>
                <span className="ml-2 font-mono">{strategy.symbol}</span>
              </div>
              <div>
                <span className="text-muted-foreground">TF:</span>
                <span className="ml-2 font-mono">{strategy.timeframe}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Settings className="w-3 h-3" />
                <span>Parameters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(strategy.params).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs font-mono">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
