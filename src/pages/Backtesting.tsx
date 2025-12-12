import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, BarChart, Bar } from "recharts";
import { Play, Download, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react";

// Generate mock backtest data
const generateEquityCurve = () => {
  let equity = 10000;
  const data = [];
  for (let i = 0; i < 100; i++) {
    const change = (Math.random() - 0.45) * 200;
    equity = Math.max(equity + change, 5000);
    data.push({
      day: i + 1,
      equity: Math.round(equity),
      drawdown: Math.random() * 5,
    });
  }
  return data;
};

const generateTradeHistory = () => {
  const trades = [];
  const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY"];
  for (let i = 0; i < 50; i++) {
    const profit = (Math.random() - 0.4) * 200;
    trades.push({
      id: i + 1,
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side: Math.random() > 0.5 ? "buy" : "sell",
      volume: (Math.random() * 0.5 + 0.1).toFixed(2),
      profit: profit.toFixed(2),
      pips: (profit / 10).toFixed(1),
    });
  }
  return trades;
};

const equityCurve = generateEquityCurve();
const tradeHistory = generateTradeHistory();

const Backtesting = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const stats = useMemo(() => {
    const profits = tradeHistory.map(t => parseFloat(t.profit));
    const wins = profits.filter(p => p > 0);
    const losses = profits.filter(p => p < 0);
    const totalProfit = profits.reduce((a, b) => a + b, 0);
    const maxDrawdown = Math.max(...equityCurve.map(d => d.drawdown));
    const profitFactor = Math.abs(wins.reduce((a, b) => a + b, 0) / losses.reduce((a, b) => a + b, 0.01));
    
    return {
      totalTrades: tradeHistory.length,
      winRate: ((wins.length / tradeHistory.length) * 100).toFixed(1),
      netProfit: totalProfit.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      avgWin: (wins.reduce((a, b) => a + b, 0) / wins.length).toFixed(2),
      avgLoss: (losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(2),
      sharpeRatio: ((totalProfit / 10000) / (maxDrawdown / 100) * Math.sqrt(252)).toFixed(2),
    };
  }, []);

  const runBacktest = () => {
    setIsRunning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Backtesting</h1>
            <p className="text-muted-foreground">Historical strategy testing</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Results
            </Button>
            <Button onClick={runBacktest} disabled={isRunning} className="gap-2">
              <Play className="w-4 h-4" />
              {isRunning ? "Running..." : "Run Backtest"}
            </Button>
          </div>
        </div>

        {/* Configuration */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Backtest Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select defaultValue="ma_cross">
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ma_cross">MA Crossover</SelectItem>
                    <SelectItem value="rsi_bands">RSI Bands</SelectItem>
                    <SelectItem value="scalper">Scalper Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Select defaultValue="EURUSD">
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EURUSD">EURUSD</SelectItem>
                    <SelectItem value="GBPUSD">GBPUSD</SelectItem>
                    <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" className="bg-secondary border-0" defaultValue="2024-01-01" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" className="bg-secondary border-0" defaultValue="2024-12-01" />
              </div>
            </div>
            {isRunning && (
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Running backtest...</span>
                  <span className="text-sm font-mono">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Net Profit", value: `$${stats.netProfit}`, color: parseFloat(stats.netProfit) >= 0 ? "text-buy" : "text-sell" },
            { label: "Win Rate", value: `${stats.winRate}%`, color: "text-foreground" },
            { label: "Max Drawdown", value: `${stats.maxDrawdown}%`, color: "text-warning" },
            { label: "Profit Factor", value: stats.profitFactor, color: "text-foreground" },
            { label: "Total Trades", value: stats.totalTrades, color: "text-foreground" },
            { label: "Avg Win", value: `$${stats.avgWin}`, color: "text-buy" },
            { label: "Avg Loss", value: `$${stats.avgLoss}`, color: "text-sell" },
            { label: "Sharpe Ratio", value: stats.sharpeRatio, color: "text-foreground" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="equity" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
            <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Returns</TabsTrigger>
          </TabsList>

          <TabsContent value="equity">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Equity Curve</CardTitle>
                <CardDescription>Account balance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve}>
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} domain={['dataMin - 500', 'dataMax + 500']} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                      <ReferenceLine y={10000} stroke="hsl(215, 15%, 40%)" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" fill="url(#equityGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drawdown">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Drawdown Analysis</CardTitle>
                <CardDescription>Maximum drawdown over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve}>
                      <defs>
                        <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--sell))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--sell))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} domain={[0, 10]} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--sell))" fill="url(#drawdownGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>{tradeHistory.length} trades executed</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Pips</TableHead>
                      <TableHead>Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeHistory.slice(0, 20).map((trade) => (
                      <TableRow key={trade.id} className="border-border">
                        <TableCell className="font-mono">{trade.id}</TableCell>
                        <TableCell>{trade.date}</TableCell>
                        <TableCell className="font-mono font-semibold">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.side === "buy" ? "default" : "destructive"}>
                            {trade.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{trade.volume}</TableCell>
                        <TableCell className={`font-mono ${parseFloat(trade.pips) >= 0 ? "text-buy" : "text-sell"}`}>
                          {parseFloat(trade.pips) >= 0 ? "+" : ""}{trade.pips}
                        </TableCell>
                        <TableCell className={`font-mono font-semibold ${parseFloat(trade.profit) >= 0 ? "text-buy" : "text-sell"}`}>
                          {parseFloat(trade.profit) >= 0 ? "+" : ""}${trade.profit}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Monthly Returns</CardTitle>
                <CardDescription>Performance breakdown by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: "Jan", return: 4.2 },
                      { month: "Feb", return: -1.8 },
                      { month: "Mar", return: 3.5 },
                      { month: "Apr", return: 2.1 },
                      { month: "May", return: -0.5 },
                      { month: "Jun", return: 5.8 },
                      { month: "Jul", return: 1.2 },
                      { month: "Aug", return: -2.3 },
                      { month: "Sep", return: 4.1 },
                      { month: "Oct", return: 3.2 },
                      { month: "Nov", return: 1.9 },
                      { month: "Dec", return: 2.8 },
                    ]}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                      <ReferenceLine y={0} stroke="hsl(215, 15%, 40%)" />
                      <Bar dataKey="return" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Backtesting;
