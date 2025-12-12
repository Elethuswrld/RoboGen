import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Calendar, TrendingUp, TrendingDown, MessageSquare, Image, Download, Plus } from "lucide-react";

const mockJournalEntries = [
  {
    id: 1,
    date: "2024-12-05",
    symbol: "EURUSD",
    side: "buy",
    entry: 1.0875,
    exit: 1.0920,
    profit: 225,
    pips: 45,
    strategy: "MA Crossover",
    reason: "Strong bullish crossover on H1 with RSI confirmation above 50",
    notes: "Waited for pullback to 20 EMA before entry. Good patience.",
    rating: 5,
    lessons: "Trust the setup, don't enter too early",
  },
  {
    id: 2,
    date: "2024-12-04",
    symbol: "XAUUSD",
    side: "sell",
    entry: 2045.50,
    exit: 2028.30,
    profit: 172,
    pips: 17.2,
    strategy: "RSI Bands",
    reason: "RSI hit 75, showing overbought conditions with bearish divergence",
    notes: "Should have held longer, exited too early on the first bounce",
    rating: 3,
    lessons: "Let winners run, use trailing stops",
  },
  {
    id: 3,
    date: "2024-12-03",
    symbol: "GBPUSD",
    side: "buy",
    entry: 1.2650,
    exit: 1.2620,
    profit: -90,
    pips: -30,
    strategy: "Breakout",
    reason: "Breakout above resistance at 1.2640",
    notes: "False breakout, should have waited for confirmation candle",
    rating: 2,
    lessons: "Wait for confirmation, avoid FOMO entries",
  },
];

const TradeJournal = () => {
  const [entries, setEntries] = useState(mockJournalEntries);
  const [selectedEntry, setSelectedEntry] = useState<typeof mockJournalEntries[0] | null>(null);
  const [filter, setFilter] = useState("all");

  const filteredEntries = entries.filter(e => {
    if (filter === "all") return true;
    if (filter === "winners") return e.profit > 0;
    if (filter === "losers") return e.profit < 0;
    return true;
  });

  const totalProfit = entries.reduce((sum, e) => sum + e.profit, 0);
  const avgRating = entries.reduce((sum, e) => sum + e.rating, 0) / entries.length;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
      />
    ));
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trade Journal</h1>
            <p className="text-muted-foreground">{entries.length} journal entries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add Journal Entry</DialogTitle>
                  <DialogDescription>Record your trade analysis and learnings</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea placeholder="What was your reason for entering this trade?" className="bg-secondary border-0" />
                  <Textarea placeholder="What did you learn from this trade?" className="bg-secondary border-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Rating:</span>
                    <div className="flex">{renderStars(4)}</div>
                  </div>
                  <Button className="w-full">Save Entry</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total P/L</p>
              <p className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? "text-buy" : "text-sell"}`}>
                ${totalProfit.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                <div className="flex">{renderStars(Math.round(avgRating))}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Winners</p>
              <p className="text-2xl font-bold text-buy">{entries.filter(e => e.profit > 0).length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Losers</p>
              <p className="text-2xl font-bold text-sell">{entries.filter(e => e.profit < 0).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              <SelectItem value="winners">Winners Only</SelectItem>
              <SelectItem value="losers">Losers Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {filteredEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={`bg-card border-border cursor-pointer transition-all hover:border-primary/50 ${
                    selectedEntry?.id === entry.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {entry.profit >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-buy" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-sell" />
                        )}
                        <span className="font-mono font-semibold">{entry.symbol}</span>
                        <Badge variant={entry.side === "buy" ? "default" : "destructive"}>
                          {entry.side.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{entry.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xl font-bold font-mono ${entry.profit >= 0 ? "text-buy" : "text-sell"}`}>
                        {entry.profit >= 0 ? "+" : ""}${entry.profit}
                      </span>
                      <div className="flex">{renderStars(entry.rating)}</div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{entry.reason}</p>

                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline">{entry.strategy}</Badge>
                      <Badge variant="outline">{entry.pips > 0 ? "+" : ""}{entry.pips} pips</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Detail Panel */}
          <Card className="bg-card border-border h-fit">
            {selectedEntry ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono">{selectedEntry.symbol}</span>
                      <Badge variant={selectedEntry.side === "buy" ? "default" : "destructive"}>
                        {selectedEntry.side.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <div className="flex">{renderStars(selectedEntry.rating)}</div>
                  </div>
                  <CardDescription>{selectedEntry.date} • {selectedEntry.strategy}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="font-mono font-semibold">{selectedEntry.entry}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Exit</p>
                      <p className="font-mono font-semibold">{selectedEntry.exit}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">P/L</p>
                      <p className={`font-mono font-semibold ${selectedEntry.profit >= 0 ? "text-buy" : "text-sell"}`}>
                        {selectedEntry.profit >= 0 ? "+" : ""}${selectedEntry.profit}
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Pips</p>
                      <p className={`font-mono font-semibold ${selectedEntry.pips >= 0 ? "text-buy" : "text-sell"}`}>
                        {selectedEntry.pips >= 0 ? "+" : ""}{selectedEntry.pips}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Entry Reason
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg">
                      {selectedEntry.reason}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg">
                      {selectedEntry.notes}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-warning">Key Lesson</h4>
                    <p className="text-sm p-3 bg-warning/10 rounded-lg border border-warning/20">
                      {selectedEntry.lessons}
                    </p>
                  </div>

                  <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                    <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Chart snapshot</p>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a trade to view details</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default TradeJournal;
