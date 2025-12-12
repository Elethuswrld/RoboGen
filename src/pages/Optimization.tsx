import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Play, Zap, Target, TrendingUp } from "lucide-react";

const optimizationResults = [
  { id: 1, fastPeriod: 8, slowPeriod: 21, profit: 2450, drawdown: 3.2, winRate: 62, sharpe: 1.85, score: 94 },
  { id: 2, fastPeriod: 10, slowPeriod: 25, profit: 2180, drawdown: 2.8, winRate: 58, sharpe: 1.92, score: 91 },
  { id: 3, fastPeriod: 12, slowPeriod: 26, profit: 2320, drawdown: 3.5, winRate: 61, sharpe: 1.78, score: 89 },
  { id: 4, fastPeriod: 9, slowPeriod: 22, profit: 1980, drawdown: 2.5, winRate: 55, sharpe: 1.95, score: 87 },
  { id: 5, fastPeriod: 14, slowPeriod: 30, profit: 2050, drawdown: 4.1, winRate: 59, sharpe: 1.62, score: 82 },
  { id: 6, fastPeriod: 7, slowPeriod: 18, profit: 1850, drawdown: 4.5, winRate: 52, sharpe: 1.45, score: 75 },
];

const scatterData = optimizationResults.map(r => ({
  x: r.drawdown,
  y: r.profit,
  score: r.score,
}));

const Optimization = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [method, setMethod] = useState("grid");

  const runOptimization = () => {
    setIsRunning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return p + 2;
      });
    }, 100);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Strategy Optimization</h1>
            <p className="text-muted-foreground">Find optimal parameters for your strategies</p>
          </div>
          <Button onClick={runOptimization} disabled={isRunning} className="gap-2">
            <Play className="w-4 h-4" />
            {isRunning ? "Optimizing..." : "Start Optimization"}
          </Button>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle>Parameter Ranges</CardTitle>
              <CardDescription>Define the search space for optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Strategy</Label>
                  <Select defaultValue="ma_cross">
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ma_cross">MA Crossover</SelectItem>
                      <SelectItem value="rsi_bands">RSI Bands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid Search</SelectItem>
                      <SelectItem value="genetic">Genetic Algorithm</SelectItem>
                      <SelectItem value="monte">Monte Carlo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Objective</Label>
                  <Select defaultValue="sharpe">
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sharpe">Max Sharpe Ratio</SelectItem>
                      <SelectItem value="profit">Max Profit</SelectItem>
                      <SelectItem value="drawdown">Min Drawdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                  <h4 className="font-medium">Fast Period</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Min</Label>
                      <Input defaultValue="5" className="bg-secondary border-0" />
                    </div>
                    <div>
                      <Label className="text-xs">Max</Label>
                      <Input defaultValue="20" className="bg-secondary border-0" />
                    </div>
                    <div>
                      <Label className="text-xs">Step</Label>
                      <Input defaultValue="1" className="bg-secondary border-0" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                  <h4 className="font-medium">Slow Period</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Min</Label>
                      <Input defaultValue="15" className="bg-secondary border-0" />
                    </div>
                    <div>
                      <Label className="text-xs">Max</Label>
                      <Input defaultValue="50" className="bg-secondary border-0" />
                    </div>
                    <div>
                      <Label className="text-xs">Step</Label>
                      <Input defaultValue="5" className="bg-secondary border-0" />
                    </div>
                  </div>
                </div>
              </div>

              {isRunning && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Testing combinations...</span>
                    <span className="text-sm font-mono">{progress}% ({Math.floor(progress * 1.2)} / 120)</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Best Parameters</CardTitle>
              <CardDescription>Top performing configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Optimal Set #1</span>
                  <Badge className="ml-auto">Score: 94</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fast Period</span>
                    <span className="font-mono">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slow Period</span>
                    <span className="font-mono">21</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Profit</span>
                    <span className="font-mono text-buy">$2,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max DD</span>
                    <span className="font-mono">3.2%</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">Apply Parameters</Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>120 combinations tested</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scatter Plot */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Profit vs Drawdown</CardTitle>
            <CardDescription>Risk-adjusted performance visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis type="number" dataKey="x" name="Drawdown" unit="%" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                  <YAxis type="number" dataKey="y" name="Profit" unit="$" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 90 ? "hsl(var(--primary))" : entry.score > 80 ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>All Results</CardTitle>
            <CardDescription>Ranked by optimization score</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Rank</TableHead>
                  <TableHead>Fast Period</TableHead>
                  <TableHead>Slow Period</TableHead>
                  <TableHead>Net Profit</TableHead>
                  <TableHead>Max DD</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>Sharpe</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optimizationResults.map((result, i) => (
                  <TableRow key={result.id} className={`border-border ${i === 0 ? "bg-primary/5" : ""}`}>
                    <TableCell>
                      {i === 0 ? <Badge>Best</Badge> : <span className="text-muted-foreground">#{i + 1}</span>}
                    </TableCell>
                    <TableCell className="font-mono">{result.fastPeriod}</TableCell>
                    <TableCell className="font-mono">{result.slowPeriod}</TableCell>
                    <TableCell className="font-mono text-buy">${result.profit}</TableCell>
                    <TableCell className="font-mono">{result.drawdown}%</TableCell>
                    <TableCell className="font-mono">{result.winRate}%</TableCell>
                    <TableCell className="font-mono">{result.sharpe}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={result.score} className="w-16 h-2" />
                        <span className="font-mono text-sm">{result.score}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Optimization;
