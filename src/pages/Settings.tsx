import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Key, Monitor, Bell, RefreshCw, Save, Send, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [riskSettings, setRiskSettings] = useState({
    maxDrawdown: 5,
    maxTrades: 5,
    maxLotSize: 1.0,
    riskPerTrade: 1,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    telegram: false,
    tradeAlerts: true,
    dailySummary: true,
    riskAlerts: true,
  });

  const [telegramConfig, setTelegramConfig] = useState({
    botToken: "",
    chatId: "",
    isVerified: false,
  });

  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      toast.error("Please enter both Bot Token and Chat ID");
      return;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("notifications", {
        body: {
          type: "telegram",
          config: {
            botToken: telegramConfig.botToken,
            chatId: telegramConfig.chatId,
          },
          payload: {
            type: "test",
            message: "🤖 TradeBot Test Notification\n\nYour Telegram integration is working correctly!",
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      setTelegramConfig((prev) => ({ ...prev, isVerified: true }));
      toast.success("Test notification sent successfully!");
    } catch (error) {
      console.error("Telegram test error:", error);
      toast.error("Failed to send test notification. Check your credentials.");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your trading bot</p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="risk" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="risk" className="gap-2"><Shield className="w-4 h-4" />Risk Management</TabsTrigger>
            <TabsTrigger value="api" className="gap-2"><Key className="w-4 h-4" />API Keys</TabsTrigger>
            <TabsTrigger value="mt5" className="gap-2"><Monitor className="w-4 h-4" />MT5 Settings</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" />Notifications</TabsTrigger>
            <TabsTrigger value="auto" className="gap-2"><RefreshCw className="w-4 h-4" />Auto-restart</TabsTrigger>
          </TabsList>

          <TabsContent value="risk" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>Configure risk limits and position sizing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Maximum Daily Drawdown</Label>
                      <span className="text-sm font-mono">{riskSettings.maxDrawdown}%</span>
                    </div>
                    <Slider
                      value={[riskSettings.maxDrawdown]}
                      onValueChange={([v]) => setRiskSettings(s => ({ ...s, maxDrawdown: v }))}
                      max={10}
                      min={1}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Trading stops when daily loss exceeds this limit</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Maximum Concurrent Trades</Label>
                      <span className="text-sm font-mono">{riskSettings.maxTrades}</span>
                    </div>
                    <Slider
                      value={[riskSettings.maxTrades]}
                      onValueChange={([v]) => setRiskSettings(s => ({ ...s, maxTrades: v }))}
                      max={10}
                      min={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Maximum Lot Size</Label>
                      <span className="text-sm font-mono">{riskSettings.maxLotSize}</span>
                    </div>
                    <Slider
                      value={[riskSettings.maxLotSize]}
                      onValueChange={([v]) => setRiskSettings(s => ({ ...s, maxLotSize: v }))}
                      max={5}
                      min={0.01}
                      step={0.01}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Risk Per Trade</Label>
                      <span className="text-sm font-mono">{riskSettings.riskPerTrade}%</span>
                    </div>
                    <Slider
                      value={[riskSettings.riskPerTrade]}
                      onValueChange={([v]) => setRiskSettings(s => ({ ...s, riskPerTrade: v }))}
                      max={5}
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Manage your API keys and secrets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>MT5 Bridge Key</Label>
                  <Input type="password" placeholder="••••••••••••••••" className="bg-secondary border-0 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <Input type="password" placeholder="••••••••••••••••" className="bg-secondary border-0 font-mono" />
                </div>
                <Button variant="outline">Regenerate Keys</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mt5" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>MT5 Terminal Settings</CardTitle>
                <CardDescription>Configure your MT5 connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Server</Label>
                    <Input placeholder="broker-server.com" className="bg-secondary border-0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input placeholder="12345678" className="bg-secondary border-0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select defaultValue="demo">
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo Account</SelectItem>
                      <SelectItem value="live">Live Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {/* Telegram Setup Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#0088cc]" />
                  Telegram Notifications
                </CardTitle>
                <CardDescription>
                  Receive real-time trade alerts directly in Telegram
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <h4 className="font-medium mb-2">How to set up:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Create a bot with @BotFather on Telegram</li>
                    <li>Copy the bot token provided</li>
                    <li>Start a chat with your bot and send any message</li>
                    <li>Get your Chat ID from @userinfobot</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bot Token</Label>
                    <Input
                      type="password"
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={telegramConfig.botToken}
                      onChange={(e) =>
                        setTelegramConfig((prev) => ({
                          ...prev,
                          botToken: e.target.value,
                          isVerified: false,
                        }))
                      }
                      className="bg-secondary border-0 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chat ID</Label>
                    <Input
                      placeholder="123456789"
                      value={telegramConfig.chatId}
                      onChange={(e) =>
                        setTelegramConfig((prev) => ({
                          ...prev,
                          chatId: e.target.value,
                          isVerified: false,
                        }))
                      }
                      className="bg-secondary border-0 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleTestTelegram}
                    disabled={isSendingTest}
                    className="gap-2"
                  >
                    {isSendingTest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Test Message
                  </Button>
                  {telegramConfig.isVerified && (
                    <span className="flex items-center gap-1 text-sm text-buy">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <Label className="font-medium">Enable Telegram</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications via Telegram
                    </p>
                  </div>
                  <Switch
                    checked={notifications.telegram}
                    onCheckedChange={(v) =>
                      setNotifications((n) => ({ ...n, telegram: v }))
                    }
                    disabled={!telegramConfig.isVerified}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Delivery Methods</h4>
                  {[
                    { key: "email", label: "Email Notifications" },
                    { key: "push", label: "Push Notifications" },
                    { key: "sms", label: "SMS Notifications" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label>{item.label}</Label>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(v) => setNotifications(n => ({ ...n, [item.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Alert Types</h4>
                  {[
                    { key: "tradeAlerts", label: "Trade Execution Alerts" },
                    { key: "dailySummary", label: "Daily Summary" },
                    { key: "riskAlerts", label: "Risk Limit Alerts" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label>{item.label}</Label>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(v) => setNotifications(n => ({ ...n, [item.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auto" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Auto-restart Rules</CardTitle>
                <CardDescription>Configure automatic recovery behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Auto-reconnect on disconnect", defaultChecked: true },
                  { label: "Resume trading after restart", defaultChecked: false },
                  { label: "Auto-restart after daily reset", defaultChecked: true },
                  { label: "Kill switch on critical error", defaultChecked: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Label>{item.label}</Label>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
