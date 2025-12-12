import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Mail, MessageSquare, Smartphone, Check, X, AlertTriangle, TrendingUp, Shield, Wifi } from "lucide-react";

const mockNotifications = [
  { id: 1, type: "trade", title: "Trade Executed", message: "BUY EURUSD 0.5 lots @ 1.0875", time: "2 min ago", read: false },
  { id: 2, type: "risk", title: "Risk Alert", message: "Daily drawdown at 2.8% - approaching limit", time: "15 min ago", read: false },
  { id: 3, type: "connection", title: "Connection Restored", message: "MT5 connection re-established", time: "1 hour ago", read: true },
  { id: 4, type: "trade", title: "Take Profit Hit", message: "+$125 on XAUUSD position", time: "2 hours ago", read: true },
  { id: 5, type: "strategy", title: "Strategy Update", message: "MA Crossover strategy triggered buy signal", time: "3 hours ago", read: true },
  { id: 6, type: "summary", title: "Daily Summary", message: "Today: 5 trades, +$342 profit, 60% win rate", time: "Yesterday", read: true },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    sms: false,
    tradeExecutions: true,
    riskAlerts: true,
    dailySummary: true,
    connectionAlerts: true,
    strategySignals: false,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "trade": return <TrendingUp className="w-4 h-4 text-buy" />;
      case "risk": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "connection": return <Wifi className="w-4 h-4 text-accent" />;
      case "strategy": return <Shield className="w-4 h-4 text-primary" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">{unreadCount} unread notifications</p>
          </div>
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        <Tabs defaultValue="inbox" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="inbox" className="gap-2">
              <Bell className="w-4 h-4" />
              Inbox
              {unreadCount > 0 && <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Mail className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            <Card className="bg-card border-border">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notification.read ? "bg-secondary/30 border-border" : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{notification.title}</h4>
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Delivery Methods
                  </CardTitle>
                  <CardDescription>Choose how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.email}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, email: v }))}
                    />
                  </div>
                  {settings.email && (
                    <Input placeholder="your@email.com" className="bg-secondary border-0 ml-8" />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">Browser push notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.push}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, push: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-xs text-muted-foreground">Critical alerts via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.sms}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, sms: v }))}
                    />
                  </div>
                  {settings.sms && (
                    <Input placeholder="+1 234 567 8900" className="bg-secondary border-0 ml-8" />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Telegram</Label>
                        <p className="text-xs text-muted-foreground">Instant messaging alerts</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Alert Types
                  </CardTitle>
                  <CardDescription>Choose which events trigger notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: "tradeExecutions", label: "Trade Executions", desc: "Order fills and closures", icon: TrendingUp },
                    { key: "riskAlerts", label: "Risk Alerts", desc: "Drawdown and exposure warnings", icon: AlertTriangle },
                    { key: "dailySummary", label: "Daily Summary", desc: "End of day performance report", icon: Mail },
                    { key: "connectionAlerts", label: "Connection Alerts", desc: "MT5 connection status changes", icon: Wifi },
                    { key: "strategySignals", label: "Strategy Signals", desc: "Entry and exit signals", icon: Shield },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <Label>{item.label}</Label>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings[item.key as keyof typeof settings] as boolean}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, [item.key]: v }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Notifications;
