import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Edit, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Position } from "@/types/trading";

const mockPositions: Position[] = [
  { id: "1", ticket: 1001, symbol: "EURUSD", side: "buy", volume: 0.5, openPrice: 1.0875, currentPrice: 1.0892, profit: 85.0, sl: 1.0850, tp: 1.0920, openTime: Date.now(), status: "open" },
  { id: "2", ticket: 1002, symbol: "XAUUSD", side: "sell", volume: 0.1, openPrice: 2035.50, currentPrice: 2028.30, profit: 72.0, sl: 2045.00, tp: 2015.00, openTime: Date.now(), status: "open" },
  { id: "3", ticket: 1003, symbol: "GBPUSD", side: "buy", volume: 0.3, openPrice: 1.2650, currentPrice: 1.2638, profit: -36.0, sl: 1.2620, tp: 1.2700, openTime: Date.now(), status: "open" },
];

const mockPendingOrders = [
  { id: "p1", symbol: "USDJPY", side: "buy", type: "limit", volume: 0.2, price: 149.50, sl: 149.00, tp: 150.50 },
  { id: "p2", symbol: "EURUSD", side: "sell", type: "stop", volume: 0.1, price: 1.0820, sl: 1.0860, tp: 1.0750 },
];

const Positions = () => {
  const [positions, setPositions] = useState<Position[]>(mockPositions);
  
  const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
  const exposureBySymbol = positions.reduce((acc, p) => {
    acc[p.symbol] = (acc[p.symbol] || 0) + p.volume;
    return acc;
  }, {} as Record<string, number>);

  const closePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  const closeAll = () => setPositions([]);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Positions</h1>
            <p className="text-muted-foreground">{positions.length} open positions</p>
          </div>
          <Button variant="destructive" onClick={closeAll} disabled={positions.length === 0}>
            Close All Positions
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total P/L</p>
              <p className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? "text-buy" : "text-sell"}`}>
                {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Open Positions</p>
              <p className="text-2xl font-bold">{positions.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold font-mono">{positions.reduce((s, p) => s + p.volume, 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Leverage Health</p>
              <div className="flex items-center gap-2">
                <Progress value={35} className="flex-1" />
                <span className="text-sm font-mono">35%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="open" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="open">Open Positions</TabsTrigger>
            <TabsTrigger value="pending">Pending Orders</TabsTrigger>
            <TabsTrigger value="exposure">Exposure</TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            <Card className="bg-card border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Open Price</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>SL</TableHead>
                    <TableHead>TP</TableHead>
                    <TableHead>P/L</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id} className="border-border">
                      <TableCell className="font-mono font-semibold">{pos.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={pos.side === "buy" ? "default" : "destructive"} className="gap-1">
                          {pos.side === "buy" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {pos.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{pos.volume}</TableCell>
                      <TableCell className="font-mono">{pos.openPrice}</TableCell>
                      <TableCell className="font-mono">{pos.currentPrice}</TableCell>
                      <TableCell className="font-mono text-sell">{pos.sl}</TableCell>
                      <TableCell className="font-mono text-buy">{pos.tp}</TableCell>
                      <TableCell className={`font-mono font-semibold ${pos.profit >= 0 ? "text-buy" : "text-sell"}`}>
                        {pos.profit >= 0 ? "+" : ""}${pos.profit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => closePosition(pos.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="bg-card border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>SL</TableHead>
                    <TableHead>TP</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPendingOrders.map((order) => (
                    <TableRow key={order.id} className="border-border">
                      <TableCell className="font-mono font-semibold">{order.symbol}</TableCell>
                      <TableCell><Badge variant="outline">{order.type.toUpperCase()}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={order.side === "buy" ? "default" : "destructive"}>
                          {order.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{order.volume}</TableCell>
                      <TableCell className="font-mono">{order.price}</TableCell>
                      <TableCell className="font-mono text-sell">{order.sl}</TableCell>
                      <TableCell className="font-mono text-buy">{order.tp}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="exposure">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(exposureBySymbol).map(([symbol, volume]) => (
                <Card key={symbol} className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {symbol}
                      {volume > 1 && <AlertTriangle className="w-4 h-4 text-warning" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold font-mono">{volume.toFixed(2)} lots</p>
                    <Progress value={(volume / 2) * 100} className="mt-2" />
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

export default Positions;
