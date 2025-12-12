import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertTriangle, CheckCircle, XCircle, Wifi, TrendingUp, Shield, Search, Filter } from "lucide-react";
import { Log } from "@/types/trading";

const mockLogs: Log[] = [
  { timestamp: new Date().toISOString(), level: "info", message: "MT5 connection established successfully", category: "connection" },
  { timestamp: new Date(Date.now() - 60000).toISOString(), level: "success", message: "BUY EURUSD 0.5 lots @ 1.0875 executed", category: "execution" },
  { timestamp: new Date(Date.now() - 120000).toISOString(), level: "info", message: "MA Crossover strategy triggered buy signal for EURUSD", category: "strategy" },
  { timestamp: new Date(Date.now() - 180000).toISOString(), level: "warning", message: "High spread detected on GBPUSD (4.2 pips)", category: "risk" },
  { timestamp: new Date(Date.now() - 240000).toISOString(), level: "error", message: "Order rejected: Insufficient margin", category: "execution" },
  { timestamp: new Date(Date.now() - 300000).toISOString(), level: "info", message: "RSI indicator oversold condition detected", category: "strategy" },
  { timestamp: new Date(Date.now() - 360000).toISOString(), level: "success", message: "Take profit hit: +$85.00 on XAUUSD", category: "execution" },
  { timestamp: new Date(Date.now() - 420000).toISOString(), level: "warning", message: "Daily drawdown at 2.1% - approaching limit", category: "risk" },
  { timestamp: new Date(Date.now() - 480000).toISOString(), level: "info", message: "Scalper Pro strategy disabled by user", category: "strategy" },
  { timestamp: new Date(Date.now() - 540000).toISOString(), level: "error", message: "WebSocket connection lost - reconnecting...", category: "connection" },
];

const categories = [
  { value: "all", label: "All Categories", icon: Activity },
  { value: "connection", label: "Connection", icon: Wifi },
  { value: "execution", label: "Execution", icon: TrendingUp },
  { value: "strategy", label: "Strategy", icon: Activity },
  { value: "risk", label: "Risk", icon: Shield },
];

const ActivityLog = () => {
  const [logs, setLogs] = useState<Log[]>(mockLogs);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter(log => {
    const matchesCategory = filter === "all" || log.category === filter;
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getIcon = (level: string) => {
    switch (level) {
      case "success": return <CheckCircle className="w-4 h-4 text-buy" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error": return <XCircle className="w-4 h-4 text-sell" />;
      default: return <Activity className="w-4 h-4 text-accent" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success": return "border-l-buy";
      case "warning": return "border-l-warning";
      case "error": return "border-l-sell";
      default: return "border-l-accent";
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">Real-time event stream</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-secondary border-0"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 bg-secondary border-0">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: logs.length, icon: Activity, color: "text-accent" },
            { label: "Errors", value: logs.filter(l => l.level === "error").length, icon: XCircle, color: "text-sell" },
            { label: "Warnings", value: logs.filter(l => l.level === "warning").length, icon: AlertTriangle, color: "text-warning" },
            { label: "Executions", value: logs.filter(l => l.category === "execution").length, icon: TrendingUp, color: "text-buy" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Log Stream */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-buy animate-pulse" />
              Live Event Stream
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-2">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg bg-secondary/50 border-l-4 ${getLevelColor(log.level)} animate-slide-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatTime(log.timestamp)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.category}
                        </Badge>
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ActivityLog;
