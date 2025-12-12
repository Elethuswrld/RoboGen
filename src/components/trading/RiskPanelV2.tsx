import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Save, AlertTriangle, Clock, TrendingDown, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RiskSettings, SessionFilter } from "@/types/trading";

interface RiskPanelV2Props {
  settings: RiskSettings;
  onUpdateSettings: (settings: Partial<RiskSettings>) => void;
}

export const RiskPanelV2 = ({ settings, onUpdateSettings }: RiskPanelV2Props) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: keyof RiskSettings, value: number | boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSessionChange = (key: keyof SessionFilter, value: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      sessionFilter: { ...prev.sessionFilter, [key]: value },
    }));
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
          <h3 className="font-semibold">Risk Management v2</h3>
        </div>
        {hasChanges && (
          <Button size="sm" onClick={handleSave} className="gap-1">
            <Save className="w-3 h-3" />
            Save
          </Button>
        )}
      </div>

      <Tabs defaultValue="limits" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 grid grid-cols-3 w-auto">
          <TabsTrigger value="limits" className="text-xs">Limits</TabsTrigger>
          <TabsTrigger value="protection" className="text-xs">Protection</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">Sessions</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="limits" className="mt-0 space-y-4">
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <p className="text-xs text-warning">
                Risk limits protect your capital. Trading stops when limits are hit.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <TrendingDown className="w-3 h-3" />
                Max Daily Drawdown (%)
              </Label>
              <Input
                type="number"
                value={localSettings.maxDailyDrawdownPct}
                onChange={(e) => handleChange("maxDailyDrawdownPct", Number(e.target.value))}
                className="font-mono"
                min={1}
                max={20}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <TrendingDown className="w-3 h-3" />
                Max Weekly Drawdown (%)
              </Label>
              <Input
                type="number"
                value={localSettings.maxWeeklyDrawdownPct}
                onChange={(e) => handleChange("maxWeeklyDrawdownPct", Number(e.target.value))}
                className="font-mono"
                min={1}
                max={30}
                step={1}
              />
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
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Max Trades Per Day</Label>
              <Input
                type="number"
                value={localSettings.maxTradesPerDay}
                onChange={(e) => handleChange("maxTradesPerDay", Number(e.target.value))}
                className="font-mono"
                min={1}
                max={100}
              />
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
            </div>
          </TabsContent>

          <TabsContent value="protection" className="mt-0 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Protection features automatically manage your trades.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="text-sm font-medium">Hard Stop-Loss</Label>
                <p className="text-xs text-muted-foreground">Require SL on every trade</p>
              </div>
              <Switch
                checked={localSettings.hardStopLoss}
                onCheckedChange={(checked) => handleChange("hardStopLoss", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="text-sm font-medium">Auto Breakeven</Label>
                <p className="text-xs text-muted-foreground">Move SL to entry when in profit</p>
              </div>
              <Switch
                checked={localSettings.autoBreakeven}
                onCheckedChange={(checked) => handleChange("autoBreakeven", checked)}
              />
            </div>

            {localSettings.autoBreakeven && (
              <div className="space-y-2 ml-4">
                <Label className="text-sm">Breakeven Trigger (pips)</Label>
                <Input
                  type="number"
                  value={localSettings.autoBreakevenPips}
                  onChange={(e) => handleChange("autoBreakevenPips", Number(e.target.value))}
                  className="font-mono"
                  min={5}
                  max={100}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="text-sm font-medium">Trailing Stop</Label>
                <p className="text-xs text-muted-foreground">ATR-based trailing stop</p>
              </div>
              <Switch
                checked={localSettings.trailingStop}
                onCheckedChange={(checked) => handleChange("trailingStop", checked)}
              />
            </div>

            {localSettings.trailingStop && (
              <div className="space-y-2 ml-4">
                <Label className="text-sm">Trailing Distance (pips)</Label>
                <Input
                  type="number"
                  value={localSettings.trailingStopPips}
                  onChange={(e) => handleChange("trailingStopPips", Number(e.target.value))}
                  className="font-mono"
                  min={5}
                  max={100}
                />
              </div>
            )}

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
                Pause trading before/after major news
              </p>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-0 space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 border flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Control when the robot can trade based on market sessions.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="text-sm font-medium">Session Filter</Label>
                <p className="text-xs text-muted-foreground">Enable session-based trading</p>
              </div>
              <Switch
                checked={localSettings.sessionFilter.enabled}
                onCheckedChange={(checked) => handleSessionChange("enabled", checked)}
              />
            </div>

            {localSettings.sessionFilter.enabled && (
              <>
                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <Label className="text-sm font-medium">Allowed Sessions</Label>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇬🇧 London (07:00-16:00 UTC)</span>
                    <Switch
                      checked={localSettings.sessionFilter.allowLondon}
                      onCheckedChange={(checked) => handleSessionChange("allowLondon", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇺🇸 New York (12:00-21:00 UTC)</span>
                    <Switch
                      checked={localSettings.sessionFilter.allowNewYork}
                      onCheckedChange={(checked) => handleSessionChange("allowNewYork", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇯🇵 Tokyo (00:00-09:00 UTC)</span>
                    <Switch
                      checked={localSettings.sessionFilter.allowTokyo}
                      onCheckedChange={(checked) => handleSessionChange("allowTokyo", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇦🇺 Sydney (21:00-06:00 UTC)</span>
                    <Switch
                      checked={localSettings.sessionFilter.allowSydney}
                      onCheckedChange={(checked) => handleSessionChange("allowSydney", checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30">
                  <div>
                    <Label className="text-sm font-medium">Block Weekends</Label>
                    <p className="text-xs text-muted-foreground">Stop trading Fri 21:00 - Sun 21:00</p>
                  </div>
                  <Switch
                    checked={localSettings.sessionFilter.blockWeekends}
                    onCheckedChange={(checked) => handleSessionChange("blockWeekends", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-warning/30">
                  <div>
                    <Label className="text-sm font-medium">Block News Events</Label>
                    <p className="text-xs text-muted-foreground">Pause during high-impact news</p>
                  </div>
                  <Switch
                    checked={localSettings.sessionFilter.blockNewsEvents}
                    onCheckedChange={(checked) => handleSessionChange("blockNewsEvents", checked)}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
