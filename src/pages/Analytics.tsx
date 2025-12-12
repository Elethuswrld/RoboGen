import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

const symbolPerformance = [
  { symbol: "EURUSD", profit: 1250, trades: 45, winRate: 62 },
  { symbol: "GBPUSD", profit: -320, trades: 28, winRate: 46 },
  { symbol: "XAUUSD", profit: 890, trades: 32, winRate: 58 },
  { symbol: "USDJPY", profit: 420, trades: 22, winRate: 55 },
];

const timeOfDayData = [
  { hour: "00:00", profit: 120 },
  { hour: "04:00", profit: -50 },
  { hour: "08:00", profit: 380 },
  { hour: "12:00", profit: 290 },
  { hour: "16:00", profit: 520 },
  { hour: "20:00", profit: 180 },
];

const dayOfWeekData = [
  { day: "Mon", profit: 450, trades: 12 },
  { day: "Tue", profit: 280, trades: 15 },
  { day: "Wed", profit: -120, trades: 18 },
  { day: "Thu", profit: 620, trades: 14 },
  { day: "Fri", profit: 340, trades: 11 },
];

const strategyCorrelation = [
  { strategy: "MA Cross", maCross: 1, rsiBands: 0.35, scalper: -0.12, breakout: 0.48 },
  { strategy: "RSI Bands", maCross: 0.35, rsiBands: 1, scalper: 0.22, breakout: 0.15 },
  { strategy: "Scalper", maCross: -0.12, rsiBands: 0.22, scalper: 1, breakout: -0.08 },
  { strategy: "Breakout", maCross: 0.48, rsiBands: 0.15, scalper: -0.08, breakout: 1 },
];

const radarData = [
  { subject: "Win Rate", A: 68, fullMark: 100 },
  { subject: "Profit Factor", A: 75, fullMark: 100 },
  { subject: "Avg Trade", A: 52, fullMark: 100 },
  { subject: "Max DD", A: 85, fullMark: 100 },
  { subject: "Sharpe", A: 72, fullMark: 100 },
  { subject: "Recovery", A: 63, fullMark: 100 },
];

const COLORS = ["hsl(142, 70%, 45%)", "hsl(0, 72%, 51%)", "hsl(210, 100%, 50%)", "hsl(38, 92%, 50%)"];

const Analytics = () => {
  const totalProfit = symbolPerformance.reduce((sum, s) => sum + s.profit, 0);
  const totalTrades = symbolPerformance.reduce((sum, s) => sum + s.trades, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Deep insights into your trading performance</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? "text-buy" : "text-sell"}`}>
                    ${totalProfit.toLocaleString()}
                  </p>
                </div>
                {totalProfit >= 0 ? <TrendingUp className="w-8 h-8 text-buy" /> : <TrendingDown className="w-8 h-8 text-sell" />}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{totalTrades}</p>
                </div>
                <Target className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best Hour</p>
                  <p className="text-2xl font-bold">16:00</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best Day</p>
                  <p className="text-2xl font-bold">Thursday</p>
                </div>
                <TrendingUp className="w-8 h-8 text-buy" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="symbols" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="symbols">Symbol Performance</TabsTrigger>
            <TabsTrigger value="time">Time Analysis</TabsTrigger>
            <TabsTrigger value="patterns">Trade Patterns</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
          </TabsList>

          <TabsContent value="symbols" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Profit by Symbol</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={symbolPerformance}>
                        <XAxis dataKey="symbol" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                          {symbolPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "hsl(var(--buy))" : "hsl(var(--sell))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Trade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={symbolPerformance} dataKey="trades" nameKey="symbol" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                          {symbolPerformance.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {symbolPerformance.map((s, i) => (
                      <Badge key={s.symbol} variant="outline" style={{ borderColor: COLORS[i] }}>
                        {s.symbol}: {s.trades}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Symbol Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {symbolPerformance.map((s) => (
                    <div key={s.symbol} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-semibold">{s.symbol}</span>
                        <Badge variant={s.profit >= 0 ? "default" : "destructive"}>
                          {s.winRate}%
                        </Badge>
                      </div>
                      <p className={`text-xl font-bold font-mono ${s.profit >= 0 ? "text-buy" : "text-sell"}`}>
                        {s.profit >= 0 ? "+" : ""}${s.profit}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.trades} trades</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Profit by Hour</CardTitle>
                  <CardDescription>Performance across trading hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeOfDayData}>
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                          {timeOfDayData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "hsl(var(--buy))" : "hsl(var(--sell))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Profit by Day of Week</CardTitle>
                  <CardDescription>Weekly performance pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayOfWeekData}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px" }} />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                          {dayOfWeekData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "hsl(var(--buy))" : "hsl(var(--sell))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <CardDescription>Multi-dimensional performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(215, 15%, 25%)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
                      <Radar name="Performance" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Strategy Correlations</CardTitle>
                <CardDescription>How strategies perform relative to each other</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="p-2 text-left"></th>
                        {["MA Cross", "RSI Bands", "Scalper", "Breakout"].map(s => (
                          <th key={s} className="p-2 text-center text-sm">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {strategyCorrelation.map((row) => (
                        <tr key={row.strategy}>
                          <td className="p-2 font-medium">{row.strategy}</td>
                          {[row.maCross, row.rsiBands, row.scalper, row.breakout].map((val, i) => (
                            <td key={i} className="p-2 text-center">
                              <div
                                className={`inline-block px-3 py-1 rounded font-mono text-sm ${
                                  val === 1 ? "bg-primary/20 text-primary" :
                                  val > 0.3 ? "bg-buy/20 text-buy" :
                                  val < -0.1 ? "bg-sell/20 text-sell" :
                                  "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {val.toFixed(2)}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Analytics;
