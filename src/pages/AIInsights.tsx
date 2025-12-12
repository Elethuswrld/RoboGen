import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

const mockInsights = [
  {
    id: 1,
    type: "market",
    title: "Market Summary",
    content: "EUR/USD is showing bullish momentum after breaking above the 1.0880 resistance. The pair is benefiting from USD weakness following dovish Fed comments. Key support at 1.0850, resistance at 1.0920.",
    confidence: 85,
    timestamp: "10 min ago",
  },
  {
    id: 2,
    type: "strategy",
    title: "Strategy Weakness Detected",
    content: "Your MA Crossover strategy has underperformed during high volatility periods (>15% VIX). Consider adding a volatility filter or reducing position size during news events.",
    confidence: 78,
    timestamp: "1 hour ago",
  },
  {
    id: 3,
    type: "recommendation",
    title: "Parameter Optimization Suggestion",
    content: "Based on recent market conditions, increasing your RSI period from 14 to 21 could improve win rate by approximately 8% while reducing false signals.",
    confidence: 72,
    timestamp: "3 hours ago",
  },
  {
    id: 4,
    type: "explanation",
    title: "Trade Decision Explained",
    content: "Your last EURUSD trade was triggered by: (1) 20 EMA crossing above 50 EMA, (2) RSI at 55 showing bullish momentum, (3) Price above daily pivot point. Exit was at TP1 after 45 pips gain.",
    confidence: 95,
    timestamp: "5 hours ago",
  },
];

const AIInsights = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setQuery("");
    }, 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "market": return <TrendingUp className="w-5 h-5 text-buy" />;
      case "strategy": return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "recommendation": return <Lightbulb className="w-5 h-5 text-accent" />;
      case "explanation": return <Brain className="w-5 h-5 text-primary" />;
      default: return <Sparkles className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              AI Insights
            </h1>
            <p className="text-muted-foreground">AI-powered trading analysis and recommendations</p>
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Insights
          </Button>
        </div>

        {/* Ask AI */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Ask AI Assistant
            </CardTitle>
            <CardDescription>Ask questions about your trading performance, strategies, or market analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Textarea
                placeholder="e.g., Why did my strategy lose money last week? What's the outlook for EURUSD?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-secondary border-0 min-h-[80px]"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                {["Market outlook", "Strategy analysis", "Explain last trade"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
              <Button onClick={handleAsk} disabled={!query.trim() || isLoading} className="gap-2">
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isLoading ? "Analyzing..." : "Ask AI"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: "Market Summary", desc: "Get today's market overview" },
            { icon: AlertTriangle, label: "Risk Analysis", desc: "Analyze portfolio risk" },
            { icon: Lightbulb, label: "Optimize Strategy", desc: "Get parameter suggestions" },
            { icon: Brain, label: "Explain Trades", desc: "Understand robot decisions" },
          ].map((action) => (
            <Card key={action.label} className="bg-card border-border hover:border-primary/50 cursor-pointer transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights Feed */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Latest Insights</CardTitle>
            <CardDescription>AI-generated analysis based on your trading data</CardDescription>
          </CardHeader>
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-4">
              {mockInsights.map((insight) => (
                <div key={insight.id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    {getIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                          <span className="text-xs text-muted-foreground">{insight.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Capabilities */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>AI Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Market Analysis", items: ["Daily market summary", "Trend identification", "Support/resistance levels", "News impact analysis"] },
                { title: "Strategy Optimization", items: ["Parameter recommendations", "Weakness detection", "Performance attribution", "Correlation analysis"] },
                { title: "Decision Explanation", items: ["Trade rationale", "Signal breakdown", "Risk assessment", "Exit analysis"] },
              ].map((capability) => (
                <div key={capability.title} className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-semibold mb-3">{capability.title}</h4>
                  <ul className="space-y-2">
                    {capability.items.map((item) => (
                      <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AIInsights;
