import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, Settings, TrendingUp, Activity, Zap, BarChart2, Edit, Copy, Trash2 } from "lucide-react";
import { Strategy } from "@/types/trading";

const strategyTemplates = [
  { id: "ma_cross", name: "MA Crossover", description: "Classic moving average crossover strategy", icon: TrendingUp, color: "text-blue-400" },
  { id: "rsi_bands", name: "RSI Bands", description: "RSI overbought/oversold reversal strategy", icon: Activity, color: "text-purple-400" },
  { id: "scalper", name: "Scalper Pro", description: "High-frequency scalping on M1/M5", icon: Zap, color: "text-yellow-400" },
  { id: "breakout", name: "Breakout Hunter", description: "Support/resistance breakout strategy", icon: BarChart2, color: "text-green-400" },
];

const defaultStrategies: Strategy[] = [
  { id: "1", name: "MA Crossover EURUSD", symbol: "EURUSD", timeframe: "H1", enabled: true, params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
  { id: "2", name: "RSI Scalper XAUUSD", symbol: "XAUUSD", timeframe: "M15", enabled: false, params: { rsiPeriod: 14, overbought: 70, oversold: 30 } },
  { id: "3", name: "Breakout GBPUSD", symbol: "GBPUSD", timeframe: "H4", enabled: true, params: { lookback: 20, atrMultiplier: 1.5 } },
];

const Strategies = () => {
  const [strategies, setStrategies] = useState<Strategy[]>(defaultStrategies);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const toggleStrategy = (id: string) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const activeCount = strategies.filter(s => s.enabled).length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Strategies</h1>
            <p className="text-muted-foreground">{activeCount} of {strategies.length} strategies active</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Strategy
          </Button>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="library">Strategy Library</TabsTrigger>
            <TabsTrigger value="active">Active Strategies</TabsTrigger>
            <TabsTrigger value="builder">Strategy Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {strategyTemplates.map((template) => (
                <Card key={template.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-secondary ${template.color}`}>
                        <template.icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{template.description}</CardDescription>
                    <Button variant="outline" size="sm" className="w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className={`bg-card border-border ${strategy.enabled ? "border-l-4 border-l-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch checked={strategy.enabled} onCheckedChange={() => toggleStrategy(strategy.id)} />
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {strategy.name}
                          {strategy.enabled && <Badge variant="default" className="text-xs">Active</Badge>}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{strategy.symbol}</Badge>
                          <Badge variant="outline">{strategy.timeframe}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon"><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon"><Play className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Parameters</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(strategy.params).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="font-mono text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="builder" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Custom Strategy Builder</CardTitle>
                <CardDescription>Create a new strategy from scratch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Strategy Name</Label>
                    <Input placeholder="My Custom Strategy" />
                  </div>
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input placeholder="EURUSD" />
                  </div>
                </div>
                <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Strategy logic builder coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">Define entry/exit conditions with visual blocks</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Strategies;
