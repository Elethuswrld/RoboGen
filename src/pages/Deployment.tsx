import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Server, Play, Pause, RefreshCw, AlertTriangle, CheckCircle, Cloud, Database, Wifi, Monitor } from "lucide-react";

const accounts = [
  { id: 1, name: "Demo Account", broker: "IC Markets", type: "Demo", balance: 10000, status: "Active", server: "ICMarkets-Demo" },
  { id: 2, name: "Live Account", broker: "IC Markets", type: "Live", balance: 25420, status: "Disconnected", server: "ICMarkets-Live" },
  { id: 3, name: "Test Account", broker: "Pepperstone", type: "Demo", balance: 5000, status: "Inactive", server: "Pepperstone-Demo" },
];

const Deployment = () => {
  const [activeAccount, setActiveAccount] = useState(accounts[0]);
  const [isLive, setIsLive] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-buy/20 text-buy";
      case "Disconnected": return "bg-sell/20 text-sell";
      case "Inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Deployment</h1>
            <p className="text-muted-foreground">Manage trading environments and accounts</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Mode:</Label>
              <Badge variant={isLive ? "destructive" : "default"} className="text-sm">
                {isLive ? "LIVE" : "DEMO"}
              </Badge>
            </div>
            <Switch checked={isLive} onCheckedChange={setIsLive} />
          </div>
        </div>

        {/* Warning Banner */}
        {isLive && (
          <Card className="bg-sell/10 border-sell/30">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-sell" />
              <div>
                <p className="font-semibold text-sell">Live Trading Mode Active</p>
                <p className="text-sm text-muted-foreground">Real money will be used. Ensure all settings are correct.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Server, label: "Bot Status", value: "Running", status: "success" },
            { icon: Wifi, label: "MT5 Connection", value: "Connected", status: "success" },
            { icon: Cloud, label: "Cloud Sync", value: "Synced", status: "success" },
            { icon: Database, label: "Database", value: "Healthy", status: "success" },
          ].map((item) => (
            <Card key={item.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg ${item.status === "success" ? "bg-buy/20" : "bg-sell/20"}`}>
                  <item.icon className={`w-5 h-5 ${item.status === "success" ? "text-buy" : "text-sell"}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{item.value}</p>
                    <CheckCircle className="w-4 h-4 text-buy" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="accounts" className="gap-2"><Server className="w-4 h-4" />Accounts</TabsTrigger>
            <TabsTrigger value="environment" className="gap-2"><Cloud className="w-4 h-4" />Environment</TabsTrigger>
            <TabsTrigger value="controls" className="gap-2"><Monitor className="w-4 h-4" />Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  className={`bg-card border-border cursor-pointer transition-all ${
                    activeAccount.id === account.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                  }`}
                  onClick={() => setActiveAccount(account)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <Badge variant={account.type === "Live" ? "destructive" : "default"}>
                        {account.type}
                      </Badge>
                    </div>
                    <CardDescription>{account.broker}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      <span className="font-mono font-semibold">${account.balance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Server</span>
                      <span className="text-sm font-mono">{account.server}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                    </div>
                    {activeAccount.id === account.id && (
                      <Button className="w-full" size="sm">
                        {account.status === "Active" ? "Disconnect" : "Connect"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Add New Account</CardTitle>
                <CardDescription>Connect a new MT5 trading account</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Broker</Label>
                  <Select>
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icmarkets">IC Markets</SelectItem>
                      <SelectItem value="pepperstone">Pepperstone</SelectItem>
                      <SelectItem value="fxpro">FxPro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select>
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="col-span-2">Add Account</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Environment Configuration</CardTitle>
                <CardDescription>Configure deployment settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Auto-start on system boot", defaultChecked: true },
                  { label: "Auto-reconnect on connection loss", defaultChecked: true },
                  { label: "Enable logging", defaultChecked: true },
                  { label: "Cloud backup enabled", defaultChecked: false },
                  { label: "Email alerts on errors", defaultChecked: true },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <Label>{setting.label}</Label>
                    <Switch defaultChecked={setting.defaultChecked} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "CPU Usage", value: 23 },
                  { label: "Memory Usage", value: 45 },
                  { label: "Network I/O", value: 12 },
                  { label: "Disk Usage", value: 68 },
                ].map((resource) => (
                  <div key={resource.label} className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{resource.label}</Label>
                      <span className="text-sm font-mono">{resource.value}%</span>
                    </div>
                    <Progress value={resource.value} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Bot Controls</CardTitle>
                  <CardDescription>Start, stop, and restart the trading bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2">
                      <Play className="w-4 h-4" />
                      Start
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <Pause className="w-4 h-4" />
                      Stop
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Restart
                    </Button>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-buy animate-pulse" />
                      <span className="font-semibold">Running</span>
                      <span className="text-sm text-muted-foreground ml-auto">Uptime: 14h 32m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Emergency Controls</CardTitle>
                  <CardDescription>Critical safety controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="destructive" className="w-full gap-2" size="lg">
                    <AlertTriangle className="w-5 h-5" />
                    KILL SWITCH - Close All & Stop
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    This will immediately close all positions and stop all trading activity
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Deployment;
