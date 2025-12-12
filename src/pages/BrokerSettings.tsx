import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  Plus, 
  Check, 
  X, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BrokerConnection {
  id: string;
  name: string;
  type: "mt5" | "mt4" | "ctrader" | "binance" | "bybit" | "okx" | "deriv";
  status: "connected" | "disconnected" | "error";
  accountId: string;
  server?: string;
  isDemo: boolean;
  balance?: number;
  currency?: string;
}

const brokerTypes = [
  { value: "mt5", label: "MetaTrader 5", icon: "📊" },
  { value: "mt4", label: "MetaTrader 4", icon: "📈" },
  { value: "ctrader", label: "cTrader", icon: "💹" },
  { value: "binance", label: "Binance Futures", icon: "🟡" },
  { value: "bybit", label: "Bybit", icon: "🟠" },
  { value: "okx", label: "OKX", icon: "⚫" },
  { value: "deriv", label: "Deriv", icon: "🔴" },
];

const BrokerSettings = () => {
  const [connections, setConnections] = useState<BrokerConnection[]>([
    {
      id: "1",
      name: "Primary MT5",
      type: "mt5",
      status: "connected",
      accountId: "12345678",
      server: "ICMarkets-Demo",
      isDemo: true,
      balance: 10000,
      currency: "USD",
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newBroker, setNewBroker] = useState({
    name: "",
    type: "mt5" as const,
    accountId: "",
    server: "",
    apiKey: "",
    apiSecret: "",
    isDemo: true,
  });

  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (brokerId: string) => {
    setIsConnecting(brokerId);
    const broker = connections.find((c) => c.id === brokerId);
    
    try {
      const { data, error } = await supabase.functions.invoke("broker-adapter", {
        body: {
          action: "connect",
          broker: broker?.type,
          config: {
            accountId: broker?.accountId,
            server: broker?.server,
            demo: broker?.isDemo,
          },
        },
      });

      if (error) throw error;

      setConnections((prev) =>
        prev.map((c) =>
          c.id === brokerId
            ? { ...c, status: "connected", balance: data?.balance }
            : c
        )
      );
      toast.success(`Connected to ${broker?.name}`);
    } catch (error) {
      toast.error("Failed to connect to broker");
      setConnections((prev) =>
        prev.map((c) =>
          c.id === brokerId ? { ...c, status: "error" } : c
        )
      );
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = (brokerId: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === brokerId ? { ...c, status: "disconnected" } : c
      )
    );
    toast.info("Broker disconnected");
  };

  const handleRemove = (brokerId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== brokerId));
    toast.success("Broker removed");
  };

  const handleAddBroker = () => {
    if (!newBroker.name || !newBroker.accountId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newConnection: BrokerConnection = {
      id: Date.now().toString(),
      name: newBroker.name,
      type: newBroker.type,
      status: "disconnected",
      accountId: newBroker.accountId,
      server: newBroker.server,
      isDemo: newBroker.isDemo,
    };

    setConnections((prev) => [...prev, newConnection]);
    setNewBroker({
      name: "",
      type: "mt5",
      accountId: "",
      server: "",
      apiKey: "",
      apiSecret: "",
      isDemo: true,
    });
    setIsAdding(false);
    toast.success("Broker added successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-buy/20 text-buy border-buy/30";
      case "error":
        return "bg-sell/20 text-sell border-sell/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isCryptoExchange = (type: string) =>
    ["binance", "bybit", "okx"].includes(type);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Broker Settings</h1>
            <p className="text-muted-foreground">
              Configure and manage your broker connections
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Broker
          </Button>
        </div>

        {/* Connected Brokers */}
        <div className="grid gap-4">
          {connections.map((broker) => (
            <Card key={broker.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                      {brokerTypes.find((b) => b.value === broker.type)?.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{broker.name}</h3>
                        <Badge
                          variant="outline"
                          className={getStatusColor(broker.status)}
                        >
                          {broker.status === "connected" && (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          {broker.status === "error" && (
                            <X className="w-3 h-3 mr-1" />
                          )}
                          {broker.status}
                        </Badge>
                        {broker.isDemo && (
                          <Badge variant="secondary">Demo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {brokerTypes.find((b) => b.value === broker.type)?.label}{" "}
                        • Account: {broker.accountId}
                        {broker.server && ` • ${broker.server}`}
                      </p>
                      {broker.balance !== undefined && (
                        <p className="text-sm font-mono mt-2">
                          Balance:{" "}
                          <span className="text-buy font-semibold">
                            {broker.currency}
                            {broker.balance.toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {broker.status === "connected" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(broker.id)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(broker.id)}
                        disabled={isConnecting === broker.id}
                        className="gap-2"
                      >
                        {isConnecting === broker.id && (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        )}
                        Connect
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(broker.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Broker Modal */}
        {isAdding && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Broker
              </CardTitle>
              <CardDescription>
                Connect a new broker account to your trading bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs
                value={isCryptoExchange(newBroker.type) ? "crypto" : "forex"}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-secondary">
                  <TabsTrigger value="forex">Forex/CFD</TabsTrigger>
                  <TabsTrigger value="crypto">Crypto</TabsTrigger>
                </TabsList>

                <TabsContent value="forex" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Connection Name</Label>
                      <Input
                        placeholder="My MT5 Account"
                        value={newBroker.name}
                        onChange={(e) =>
                          setNewBroker({ ...newBroker, name: e.target.value })
                        }
                        className="bg-secondary border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Broker Type</Label>
                      <Select
                        value={newBroker.type}
                        onValueChange={(value: any) =>
                          setNewBroker({ ...newBroker, type: value })
                        }
                      >
                        <SelectTrigger className="bg-secondary border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mt5">MetaTrader 5</SelectItem>
                          <SelectItem value="mt4">MetaTrader 4</SelectItem>
                          <SelectItem value="ctrader">cTrader</SelectItem>
                          <SelectItem value="deriv">Deriv</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        placeholder="12345678"
                        value={newBroker.accountId}
                        onChange={(e) =>
                          setNewBroker({ ...newBroker, accountId: e.target.value })
                        }
                        className="bg-secondary border-0 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Server</Label>
                      <Input
                        placeholder="Broker-Server"
                        value={newBroker.server}
                        onChange={(e) =>
                          setNewBroker({ ...newBroker, server: e.target.value })
                        }
                        className="bg-secondary border-0"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="crypto" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Connection Name</Label>
                      <Input
                        placeholder="My Binance Account"
                        value={newBroker.name}
                        onChange={(e) =>
                          setNewBroker({ ...newBroker, name: e.target.value })
                        }
                        className="bg-secondary border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exchange</Label>
                      <Select
                        value={newBroker.type}
                        onValueChange={(value: any) =>
                          setNewBroker({ ...newBroker, type: value })
                        }
                      >
                        <SelectTrigger className="bg-secondary border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="binance">Binance Futures</SelectItem>
                          <SelectItem value="bybit">Bybit</SelectItem>
                          <SelectItem value="okx">OKX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="••••••••••••"
                        value={newBroker.apiKey}
                        onChange={(e) =>
                          setNewBroker({ ...newBroker, apiKey: e.target.value })
                        }
                        className="bg-secondary border-0 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Secret</Label>
                      <Input
                        type="password"
                        placeholder="••••••••••••"
                        value={newBroker.apiSecret}
                        onChange={(e) =>
                          setNewBroker({ ...newBroker, apiSecret: e.target.value })
                        }
                        className="bg-secondary border-0 font-mono"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <Label className="font-medium">Demo Account</Label>
                  <p className="text-xs text-muted-foreground">
                    Use demo/testnet for testing
                  </p>
                </div>
                <Switch
                  checked={newBroker.isDemo}
                  onCheckedChange={(checked) =>
                    setNewBroker({ ...newBroker, isDemo: checked })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBroker}>Add Broker</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Broker Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-primary" />
                Secure Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All broker connections use encrypted API keys stored securely in
                our vault.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4 text-warning" />
                Low Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Direct server connections for fastest order execution and data
                streaming.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="w-4 h-4 text-buy" />
                Multi-Broker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Trade across multiple brokers simultaneously with unified risk
                management.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default BrokerSettings;