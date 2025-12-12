import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Power, Wifi, WifiOff, Zap, AlertTriangle } from "lucide-react";
import type { ConnectionStatus } from "@/types/trading";

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  isTrading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartTrading: () => void;
  onStopTrading: () => void;
}

export const Header = ({
  connectionStatus,
  isTrading,
  onConnect,
  onDisconnect,
  onStartTrading,
  onStopTrading,
}: HeaderProps) => {
  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">MT5 Trading Bot</h1>
              <p className="text-xs text-muted-foreground">Automated Trading System</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border mx-2" />
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="border-primary/50 text-primary gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                Connected
              </Badge>
            ) : isConnecting ? (
              <Badge variant="outline" className="border-warning/50 text-warning gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                Connecting...
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Disconnected
              </Badge>
            )}
            
            {isTrading && (
              <Badge className="bg-primary/20 text-primary border-primary/30 gap-1.5">
                <Zap className="w-3 h-3" />
                Live Trading
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isConnected ? (
            <Button
              onClick={onConnect}
              disabled={isConnecting}
              className="gap-2"
              variant="outline"
            >
              <Wifi className="w-4 h-4" />
              {isConnecting ? "Connecting..." : "Connect MT5"}
            </Button>
          ) : (
            <>
              {!isTrading ? (
                <Button onClick={onStartTrading} className="gap-2 btn-buy">
                  <Power className="w-4 h-4" />
                  Start Trading
                </Button>
              ) : (
                <Button onClick={onStopTrading} variant="destructive" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Stop Trading
                </Button>
              )}
              
              <Button onClick={onDisconnect} variant="outline" size="icon">
                <WifiOff className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
