import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Save, AlertTriangle } from "lucide-react";
import type { RiskSettings } from "@/types/trading";

interface RiskPanelProps {
  settings: RiskSettings;
  onUpdateSettings: (settings: Partial<RiskSettings>) => void;
}

export const RiskPanel = ({ settings, onUpdateSettings }: RiskPanelProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: keyof RiskSettings, value: number) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setHasChanges(false);
  };

  return (
    <div className="trading-panel h-full flex flex-col">
      <div className="trading-panel-header">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Risk Management</h3>
        </div>
        {hasChanges && (
          <Button size="sm" onClick={handleSave} className="gap-1">
            <Save className="w-3 h-3" />
            Save
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
          <p className="text-xs text-warning">
            Risk settings protect your capital. Adjust carefully.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Max Daily Drawdown (%)</Label>
            <Input
              type="number"
              value={localSettings.maxDailyDrawdownPct}
              onChange={(e) => handleChange("maxDailyDrawdownPct", Number(e.target.value))}
              className="font-mono"
              min={1}
              max={20}
              step={0.5}
            />
            <p className="text-xs text-muted-foreground">
              Stop trading if daily loss exceeds this percentage
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Risk Per Trade (%)</Label>
            <Input
              type="number"
              value={localSettings.defaultRiskPct}
              onChange={(e) => handleChange("defaultRiskPct", Number(e.target.value))}
              className="font-mono"
              min={0.1}
              max={5}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of equity risked per trade
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Max Concurrent Trades</Label>
            <Input
              type="number"
              value={localSettings.maxConcurrentTrades}
              onChange={(e) => handleChange("maxConcurrentTrades", Number(e.target.value))}
              className="font-mono"
              min={1}
              max={20}
            />
            <p className="text-xs text-muted-foreground">
              Maximum open positions at any time
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Spread Filter (pips)</Label>
            <Input
              type="number"
              value={localSettings.spreadFilterPips}
              onChange={(e) => handleChange("spreadFilterPips", Number(e.target.value))}
              className="font-mono"
              min={0}
              max={10}
              step={0.5}
            />
            <p className="text-xs text-muted-foreground">
              Skip trades if spread exceeds this value
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">News Filter (minutes)</Label>
            <Input
              type="number"
              value={localSettings.newsFilterMinutes}
              onChange={(e) => handleChange("newsFilterMinutes", Number(e.target.value))}
              className="font-mono"
              min={0}
              max={120}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Pause trading before/after major news events
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
