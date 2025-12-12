import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Download, TrendingUp, Zap, Shield, Search, Filter } from "lucide-react";

const strategies = [
  {
    id: 1,
    name: "Trend Rider Pro",
    author: "AlgoTrader",
    description: "Advanced trend-following strategy with dynamic position sizing",
    downloads: 2450,
    rating: 4.8,
    reviews: 128,
    price: "Free",
    tags: ["Trend", "H1", "All Pairs"],
    performance: "+42% YTD",
  },
  {
    id: 2,
    name: "Scalp Master 3000",
    author: "ScalpKing",
    description: "High-frequency scalping system optimized for EURUSD M1",
    downloads: 1820,
    rating: 4.5,
    reviews: 96,
    price: "$49",
    tags: ["Scalping", "M1", "EURUSD"],
    performance: "+28% YTD",
  },
  {
    id: 3,
    name: "Gold Hunter",
    author: "MetalPro",
    description: "Specialized XAUUSD strategy using volatility breakouts",
    downloads: 980,
    rating: 4.7,
    reviews: 54,
    price: "$99",
    tags: ["Breakout", "H4", "XAUUSD"],
    performance: "+65% YTD",
  },
  {
    id: 4,
    name: "News Surfer",
    author: "FundaTrader",
    description: "Automated news trading with sentiment analysis",
    downloads: 560,
    rating: 4.2,
    reviews: 32,
    price: "Free",
    tags: ["News", "M15", "Major Pairs"],
    performance: "+18% YTD",
  },
  {
    id: 5,
    name: "Grid Bot Ultimate",
    author: "GridMaster",
    description: "Sophisticated grid trading with risk management",
    downloads: 1240,
    rating: 4.4,
    reviews: 78,
    price: "$29",
    tags: ["Grid", "All TF", "All Pairs"],
    performance: "+35% YTD",
  },
  {
    id: 6,
    name: "RSI Reversal",
    author: "TechAnalyst",
    description: "Mean reversion strategy using RSI extremes",
    downloads: 890,
    rating: 4.6,
    reviews: 45,
    price: "Free",
    tags: ["Mean Reversion", "H1", "Major Pairs"],
    performance: "+22% YTD",
  },
];

const Marketplace = () => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted-foreground"}`}
      />
    ));
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Strategy Marketplace</h1>
            <p className="text-muted-foreground">Discover and download trading strategies</p>
          </div>
          <Button variant="outline">Submit Strategy</Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search strategies..." className="pl-9 bg-secondary border-0" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        <Tabs defaultValue="popular" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="bg-card border-border hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        <CardDescription>by {strategy.author}</CardDescription>
                      </div>
                      <Badge variant={strategy.price === "Free" ? "default" : "secondary"}>
                        {strategy.price}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {strategy.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {renderStars(strategy.rating)}
                        <span className="ml-1 text-muted-foreground">({strategy.reviews})</span>
                      </div>
                      <span className="text-buy font-semibold">{strategy.performance}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {strategy.downloads.toLocaleString()}
                      </span>
                      <Button size="sm">
                        {strategy.price === "Free" ? "Download" : "Purchase"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4" />
              <p>New strategies coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="free">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.filter(s => s.price === "Free").map((strategy) => (
                <Card key={strategy.id} className="bg-card border-border hover:border-primary/50 transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <CardDescription>by {strategy.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                    <Button size="sm" className="w-full">Download Free</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="premium">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.filter(s => s.price !== "Free").map((strategy) => (
                <Card key={strategy.id} className="bg-card border-border hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        <CardDescription>by {strategy.author}</CardDescription>
                      </div>
                      <Badge variant="secondary">{strategy.price}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                    <Button size="sm" className="w-full">Purchase</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Marketplace;
